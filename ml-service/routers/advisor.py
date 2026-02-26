"""
advisor.py — AI Advisor router for GIFT ML Service.

POST /advisor/chat
  - Accepts a user message + structured context (portfolio, news, predictions)
  - Constructs a rich system prompt from available context
  - Calls Gemini (or deterministic fallback) and returns the reply
  - Also returns contextUsed flags so the frontend can show which data was active
"""

from __future__ import annotations

import json
import os
from typing import Any, AsyncGenerator, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ── Gemini client (optional — graceful fallback when key absent) ──────────────
# Always define _gemini_model so it's never unbound even if init raises.
_gemini_model = None
try:
    import google.generativeai as genai  # type: ignore

    _GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
    if _GEMINI_KEY:
        genai.configure(api_key=_GEMINI_KEY)
        _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
except Exception as _init_exc:  # catches ImportError, AttributeError, API changes, etc.
    print(f"[advisor] Gemini init skipped: {_init_exc}")
    _gemini_model = None

router = APIRouter()

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ContextPayload(BaseModel):
    portfolio: Optional[dict] = None
    newsSentiments: Optional[list] = None
    predictionHistory: Optional[list] = None


class ChatRequest(BaseModel):
    message: str
    context: ContextPayload = ContextPayload()


class ChatResponse(BaseModel):
    reply: str
    contextUsed: dict  # { portfolio: bool, news: bool, predictions: bool }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_system_prompt(context: ContextPayload) -> tuple[str, dict]:
    """Build a Gemini system prompt from available context.

    Returns (system_prompt, contextUsed).
    """
    sections: list[str] = [
        "You are GIFT AI Advisor, an expert financial assistant embedded in the "
        "GIFT (AI-Powered Finance Education & Investment Intelligence) platform. "
        "You help users understand their portfolio, interpret market news, and make "
        "informed investment decisions. Always be concise, educational, and measured — "
        "never give reckless advice. When you lack data, say so honestly.\n"
    ]

    used = {"portfolio": False, "news": False, "predictions": False}

    # ── Portfolio context ─────────────────────────────────────────────────────
    p = context.portfolio
    if p:
        used["portfolio"] = True

        # Safely coerce every metric to float so f-string formatting never raises
        # TypeError when the field is None, missing, or a non-numeric string.
        total_value     = float(p.get("totalValue")     or 0)
        total_return    = float(p.get("totalReturnPct") or 0)
        sharpe          = float(p.get("sharpeRatio")    or 0)
        var95           = float(p.get("var95")          or 0)
        beta            = float(p.get("beta")           or 0)
        risk_score      = float(p.get("riskScore")      or 0)

        holdings_summary = ""
        holdings = p.get("holdings") or []
        if holdings:
            def _weight(h: dict) -> float:
                try:
                    return float(h.get("weight") or 0)
                except (TypeError, ValueError):
                    return 0.0

            top = sorted(holdings, key=_weight, reverse=True)[:5]
            holdings_summary = ", ".join(
                f"{h.get('ticker', '?')} ({_weight(h) * 100:.1f}%)"
                for h in top
            )

        def _mc_line(p: dict) -> str:
            mc = p.get("monteCarloPercentiles")
            if not mc or not isinstance(mc, dict):
                return ""
            try:
                return (
                    f"- Monte Carlo (p5/p50/p95): "
                    f"${float(mc.get('p5') or 0):,.0f} / "
                    f"${float(mc.get('p50') or 0):,.0f} / "
                    f"${float(mc.get('p95') or 0):,.0f}\n"
                )
            except (TypeError, ValueError):
                return ""

        def _bt_line(p: dict) -> str:
            bt = p.get("backtestResult")
            if not bt or not isinstance(bt, dict):
                return ""
            try:
                total_ret = float(bt.get("totalReturn") or 0)
                drawdown  = float(bt.get("maxDrawdown") or 0)
                win_rate  = float(bt.get("winRate")     or 0)
                return (
                    f"- Backtest: return={total_ret:.2f}%, "
                    f"drawdown={drawdown:.2f}%, "
                    f"win rate={win_rate:.1%}\n"
                )
            except (TypeError, ValueError):
                return ""

        sections.append(
            "## User Portfolio (live data)\n"
            f"- Total value: ${total_value:,.2f}\n"
            f"- Total return: {total_return:.2f}%\n"
            f"- Sharpe ratio: {sharpe:.3f}\n"
            f"- VaR 95%: {var95:.4f}\n"
            f"- Beta: {beta:.3f}\n"
            f"- Risk score: {risk_score:.0f}/10\n"
            + (f"- Top holdings: {holdings_summary}\n" if holdings_summary else "")
            + (f"- AI narrative: {p.get('aiNarrative', '')}\n" if p.get("aiNarrative") else "")
            + _mc_line(p)
            + _bt_line(p)
        )

    # ── News context ──────────────────────────────────────────────────────────
    news = context.newsSentiments
    if news and len(news) > 0:
        used["news"] = True
        top_news = news[:5]
        def _news_label(a: dict) -> str:
            """Safely extract sentiment label — handles both string and dict formats."""
            sent = a.get("sentiment", "NEUTRAL")
            if isinstance(sent, dict):
                return sent.get("label", "NEUTRAL").upper()
            return str(sent).upper() if sent else "NEUTRAL"

        def _news_compound(a: dict) -> float:
            """Safely extract compound score — handles both string and dict formats."""
            sent = a.get("sentiment", None)
            if isinstance(sent, dict):
                return float(sent.get("compound", 0) or 0)
            # flat format: score is stored directly on the article
            try:
                return float(a.get("score", a.get("compound", 0)) or 0)
            except (TypeError, ValueError):
                return 0.0

        news_lines = "\n".join(
            f"  • [{_news_label(a)} {_news_compound(a):+.2f}] {a.get('title', 'Untitled')}"
            for a in top_news
        )
        sections.append(f"## Recent Market News (sentiment-scored)\n{news_lines}\n")

    # ── Prediction history ────────────────────────────────────────────────────
    preds = context.predictionHistory
    if preds and len(preds) > 0:
        used["predictions"] = True
        recent = preds[:5]
        def _conf(r: dict) -> str:
            try:
                return f"{float(r.get('confidence') or 0):.0%}"
            except (TypeError, ValueError):
                return "N/A"
        pred_lines = "\n".join(
            f"  • {r.get('ticker','?')}: user={r.get('userPrediction','?')}, "
            f"AI={r.get('aiPrediction','?')}, actual={r.get('actualOutcome','PENDING')}, "
            f"confidence={_conf(r)}"
            for r in recent
        )
        sections.append(f"## User's Recent Predictions\n{pred_lines}\n")

    if not any(used.values()):
        sections.append(
            "No personal context is available. Answer the user's question using general "
            "financial knowledge and refer them to the platform's tools where relevant."
        )

    sections.append(
        "\nReply in clear, concise English. Use markdown bullet points or numbered lists "
        "where they aid clarity. Keep responses under 250 words unless the user explicitly "
        "asks for a detailed explanation."
    )

    return "\n".join(sections), used


def _fallback_reply(message: str, used: dict) -> str:
    """Keyword-aware fallback when Gemini is unavailable."""
    lower = message.lower()

    if any(w in lower for w in ["hello", "hi ", "hey", "how are"]):
        return (
            "Hello! I'm your TradeFinX AI fin-advisor. I can help you with:\n\n"
            "- Portfolio risk & sector concentration analysis\n"
            "- Position-level buy/sell/trim recommendations\n"
            "- Rebalancing strategies with target allocations\n"
            "- Market context for your NSE/BSE holdings\n"
            "- Stock-specific queries (any NSE, BSE or US ticker)\n\n"
            "What would you like to analyse today?"
        )

    if any(w in lower for w in ["risk", "exposure", "vulner", "danger"]):
        return (
            "**Risk Exposure Analysis (based on your portfolio context):**\n\n"
            "- **Concentration risk**: IT Services is typically overweight in Indian retail portfolios "
            "vs 15% NIFTY50 benchmark — each 1% INR appreciation reduces IT EPS by ~2%\n"
            "- **Single-stock risk**: Avoid any single position exceeding 15% of total portfolio value\n"
            "- **Sector gaps**: Most NSE retail investors are underweight in Infrastructure, Energy & Metals\n\n"
            "**Recommended fixes:**\n"
            "- Trim the weakest IT stock and reallocate to FMCG or Infra (L&T, NTPC)\n"
            "- Keep VaR discipline: no position change > 5% of portfolio at once\n\n"
            "_Enable Gemini AI for a personalised analysis using your exact portfolio data._"
        )

    if any(w in lower for w in ["trim", "sell", "reduce", "exit", "cut"]):
        return (
            "**Trim / Exit Candidates — General Framework:**\n\n"
            "- Positions with the lowest return vs sector peers (laggard within the same sector)\n"
            "- Any holding where fundamental thesis has changed (earnings miss, management change)\n"
            "- Positions > 20% of portfolio for diversification discipline\n\n"
            "**Redeployment targets:**\n"
            "- FMCG defensive (ITC, HUL) for stability\n"
            "- Banking (ICICI, HDFC) for growth + yield\n"
            "- Infrastructure (L&T) for capex supercycle upside\n\n"
            "_Connect the backend with Gemini for stock-specific trim recommendations on your portfolio._"
        )

    if any(w in lower for w in ["buy", "add", "invest", "rebal", "allocat"]):
        return (
            "**Rebalancing / Addition Strategy:**\n\n"
            "- **FMCG**: Add if defensive allocation < 10% (HUL or ITC are strong choices)\n"
            "- **Banking**: ICICIBANK or HDFCBANK if financial exposure < 20%\n"
            "- **Infrastructure**: L&T benefits from India's ₹10L Cr capex budget\n"
            "- **Pharma**: SUNPHARMA or DRREDDY for defensive + export revenue\n\n"
            "**Rule of thumb**: rebalance quarterly; no single sector should exceed 35% of portfolio."
        )

    if any(w in lower for w in ["best", "top", "winner", "perform", "profit", "gain"]):
        return (
            "**Identifying Top Performers:**\n\n"
            "- Sort your holdings by absolute % return since average buy price\n"
            "- Outperformers (return > Nifty50 YTD of ~12%) — consider partial profit booking above 30% gain\n"
            "- **Typical NSE outperformers in 2024-25**: SUNPHARMA, BHARTIARTL, MARUTI, ICICIBANK\n\n"
            "**Action**: Take partial profits (20-30% of position) on holdings with >25% unrealised gain "
            "and redeploy into laggard sectors."
        )

    if any(w in lower for w in ["tesla", "tsla", "aapl", "apple", "googl", "amazon", "nvda", "nvidia", "msft", "microsoft", "meta", "faang"]):
        ticker = next((t for k, t in [("tsla", "TSLA"), ("tesla", "TSLA"), ("aapl", "AAPL"), ("apple", "AAPL"),
                                       ("googl", "GOOGL"), ("amazon", "AMZN"), ("amzn", "AMZN"),
                                       ("nvda", "NVDA"), ("nvidia", "NVDA"), ("msft", "MSFT"),
                                       ("microsoft", "MSFT"), ("meta", "META")] if k in lower), "FAANG")
        return (
            f"**{ticker} Information:**\n\n"
            f"For live {ticker} price predictions, visit the **Stock Predictor** page — our XGBoost+LSTM "
            f"ensemble model (R²≈99.8%) was trained on exactly this FAANG dataset and gives next-day "
            f"close price forecasts.\n\n"
            f"Note: {ticker} is US-listed (NYSE/NASDAQ). Adding it to an Indian portfolio requires an "
            f"international trading account under RBI's LRS scheme (max $250,000/year).\n\n"
            f"Would you like me to analyse your existing NSE portfolio positions instead?"
        )

    if any(w in lower for w in ["sector", "alloc", "diversi", "concentrat"]):
        return (
            "**Sector Allocation Guidelines (NSE portfolio):**\n\n"
            "- **IT Services**: Limit to 15-25% (NIFTY50 weight ~15%)\n"
            "- **Banking & Finance**: 25-35% for growth + yield balance\n"
            "- **FMCG**: 10-15% for defensive stability\n"
            "- **Pharma**: 8-12% for defensive + export upside\n"
            "- **Infrastructure/Industrials**: 10-15% for capex cycle exposure\n"
            "- **Auto**: 5-8% for domestic consumption play\n"
            "- **Telecom**: 5-8% for 5G growth runway\n\n"
            "**Common mistake**: Overweight IT due to familiarity bias — this increases rupee risk significantly."
        )

    if any(w in lower for w in ["help", "what can", "capabilit", "feature"]):
        return (
            "**TradeFinX AI fin-advisor — Capabilities:**\n\n"
            "- Portfolio risk analysis (concentration, VaR, sector exposure)\n"
            "- Buy / sell / trim recommendations by position\n"
            "- Sector rebalancing strategy with specific targets\n"
            "- Stock-specific analysis for any NSE, BSE or US ticker\n"
            "- Market context (RBI rates, macro trends, sector rotations)\n"
            "- FAANG stock details + ML-predicted price targets (Stock Predictor page)\n\n"
            "Try asking: 'Analyse my risk', 'Which stocks to trim?', 'How should I rebalance?'"
        )

    # Generic catch-all — still gives general portfolio advice, not just one line
    return (
        f"I understand you're asking about: **{message[:80]}**\n\n"
        "As your portfolio advisor, here's relevant context:\n"
        "- Focus on risk-adjusted returns (Sharpe ratio > 1.0 is target)\n"
        "- Diversify across at least 5 sectors to reduce single-sector risk\n"
        "- Review and rebalance quarterly — don't chase short-term momentum\n\n"
        "For a personalised answer, try rephrasing to mention: your portfolio, a specific "
        "stock ticker, or a topic like 'risk', 'rebalance', or 'sectors'.\n\n"
        "_Note: Restart the ML service to enable live Gemini AI responses._"
    )


# ── Streaming helpers ────────────────────────────────────────────────────────

async def _stream_gemini(full_prompt: str) -> AsyncGenerator[str, None]:
    """Yield SSE lines from a streamed Gemini generate_content call."""
    try:
        response = _gemini_model.generate_content(full_prompt, stream=True)  # type: ignore[union-attr]
        for chunk in response:
            text = getattr(chunk, "text", "") or ""
            if text:
                yield f"data: {json.dumps({'type': 'token', 'text': text})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"


async def _stream_with_context(
    context_event: str,
    full_prompt: str,
    use_gemini: bool,
    fallback_text: str,
) -> AsyncGenerator[str, None]:
    """Emit context event first, then delegate to Gemini stream (or fallback)."""
    yield context_event
    if use_gemini:
        async for chunk in _stream_gemini(full_prompt):
            yield chunk
    else:
        yield f"data: {json.dumps({'type': 'token', 'text': fallback_text})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        system_prompt, used = _build_system_prompt(req.context)
    except Exception as exc:  # noqa: BLE001
        print(f"[advisor] context build error: {exc}")
        system_prompt = ""
        used = {"portfolio": False, "news": False, "predictions": False}

    if _gemini_model is None:
        reply = _fallback_reply(req.message, used)
        return ChatResponse(reply=reply, contextUsed=used)

    try:
        full_prompt = f"{system_prompt}\n\nUser: {req.message}\n\nAssistant:"
        response = _gemini_model.generate_content(full_prompt)
        reply = (response.text or "").strip()
        if not reply:
            raise ValueError("Empty response from Gemini")
    except Exception as exc:  # noqa: BLE001
        print(f"[advisor] Gemini error: {exc}")
        reply = _fallback_reply(req.message, used)

    return ChatResponse(reply=reply, contextUsed=used)


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """SSE endpoint — streams Gemini reply token-by-token.

    Event types emitted in order:
      1. {type: "context", contextUsed: {...}}  — emitted before generation starts
      2. {type: "token",   text: "..."}          — one per Gemini chunk
      3. {type: "done"}                          — end of stream
      4. {type: "error",  message: "..."}        — only on failure
    """
    try:
        system_prompt, used = _build_system_prompt(req.context)
    except Exception as exc:
        print(f"[advisor/stream] context build error: {exc}")
        system_prompt = ""
        used = {"portfolio": False, "news": False, "predictions": False}

    context_event = f"data: {json.dumps({'type': 'context', 'contextUsed': used})}\n\n"
    full_prompt = f"{system_prompt}\n\nUser: {req.message}\n\nAssistant:"
    fallback_text = _fallback_reply(req.message, used)

    return StreamingResponse(
        _stream_with_context(
            context_event,
            full_prompt,
            use_gemini=(_gemini_model is not None),
            fallback_text=fallback_text,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
