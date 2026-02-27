"""
Portfolio AI router — exposes POST /portfolio/analyze.

Calls Gemini to produce a structured narrative for the user's portfolio.
Falls back to deterministic text when GEMINI_API_KEY is not set so the
rest of the pipeline never breaks.

Registered in main.py with prefix="/portfolio".
Full path: POST /portfolio/analyze
"""

import os
from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# ── Request schema ────────────────────────────────────────────────────────────

class HoldingItem(BaseModel):
    ticker:       str
    shares:       float
    avgBuyPrice:  float
    currentPrice: float
    currentValue: float
    weight:       float           # % of total portfolio


class PortfolioAnalyzeRequest(BaseModel):
    holdings:       List[HoldingItem]
    totalValue:     float
    totalCost:      float
    totalReturnPct: float
    sharpeRatio:    float
    var95:          float
    beta:           float
    riskScore:      float


# ── Prompt helpers ────────────────────────────────────────────────────────────

def _build_prompt(req: PortfolioAnalyzeRequest) -> str:
    rows = "\n".join(
        f"  {h.ticker:6s}  {h.weight:5.1f}%  "
        f"avg cost ${h.avgBuyPrice:.2f}  current ${h.currentPrice:.2f}  "
        f"value ${h.currentValue:,.2f}"
        for h in req.holdings
    )
    return f"""You are a professional portfolio analyst. A retail investor has shared their stock portfolio.

Portfolio Summary:
  Total Value : ${req.totalValue:,.2f}
  Total Cost  : ${req.totalCost:,.2f}
  Total Return: {req.totalReturnPct:+.2f}%

Holdings:
{rows}

Risk Metrics:
  Sharpe Ratio : {req.sharpeRatio:.3f}
  VaR (95%)    : {req.var95 * 100:.3f}%
  Beta         : {req.beta:.3f}
  Risk Score   : {req.riskScore:.0f} / 100

Write a concise analysis using EXACTLY the following format (include the labels verbatim):

NARRATIVE:
Write 3–4 sentences summarising portfolio health, return performance, and risk profile.

ALLOCATION:
In 1–2 sentences, identify the single biggest allocation concern (concentration risk, sector exposure, etc.).

RECOMMENDATIONS:
Provide exactly 2 short, actionable recommendations the investor can act on this week.

Be factual, encouraging, and jargon-lite. Do not use markdown bullet points or headings beyond the labels above."""


def _fallback(req: PortfolioAnalyzeRequest) -> dict:
    direction = "gaining" if req.totalReturnPct >= 0 else "down"
    largest   = max(req.holdings, key=lambda h: h.weight, default=None)
    conc      = f"{largest.ticker} ({largest.weight:.1f}%)" if largest else "a single position"
    return {
        "narrative": (
            f"Your portfolio of ${req.totalValue:,.2f} is currently {direction} "
            f"{abs(req.totalReturnPct):.2f}% overall. "
            f"The Sharpe ratio of {req.sharpeRatio:.2f} indicates "
            f"{'reasonable' if req.sharpeRatio > 1 else 'below-average'} risk-adjusted returns. "
            f"The 95% VaR of {req.var95 * 100:.2f}% and a beta of {req.beta:.2f} suggest "
            f"{'moderate' if req.riskScore < 50 else 'elevated'} market exposure."
        ),
        "allocationInsights": (
            f"Your largest position is {conc} — consider whether this concentration "
            f"aligns with your risk tolerance."
        ),
        "recommendations": (
            "1. Review any positions with unrealised losses exceeding 10% and set stop-loss levels. "
            "2. Ensure no single holding exceeds 30% of total portfolio value to limit concentration risk."
        ),
    }


def _parse_sections(text: str) -> dict:
    """Extract NARRATIVE / ALLOCATION / RECOMMENDATIONS sections from LLM output."""
    sections = {"narrative": "", "allocationInsights": "", "recommendations": ""}
    mapping = {
        "NARRATIVE:":       "narrative",
        "ALLOCATION:":      "allocationInsights",
        "RECOMMENDATIONS:": "recommendations",
    }

    current_key = None
    buffer: list[str] = []

    for line in text.splitlines():
        stripped = line.strip()
        matched = False
        for label, key in mapping.items():
            if stripped.upper().startswith(label):
                if current_key and buffer:
                    sections[current_key] = " ".join(buffer).strip()
                current_key = key
                buffer = [stripped[len(label):].strip()]
                matched = True
                break
        if not matched and current_key:
            buffer.append(stripped)

    if current_key and buffer:
        sections[current_key] = " ".join(buffer).strip()

    return sections


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/analyze", summary="Generate AI portfolio narrative and recommendations")
async def analyze_portfolio(body: PortfolioAnalyzeRequest):
    """
    Generates a Gemini-powered portfolio analysis. Returns
    ``{ "narrative", "allocationInsights", "recommendations" }`` always —
    uses a deterministic fallback when GEMINI_API_KEY is absent.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")

    if not api_key:
        return _fallback(body)

    try:
        from google import genai
        client   = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=_build_prompt(body),
        )
        sections = _parse_sections(response.text.strip())

        # If parsing failed to extract any section, use fallback
        if not any(sections.values()):
            return _fallback(body)

        return sections

    except Exception as exc:  # noqa: BLE001
        fb = _fallback(body)
        fb["narrative"] += f" (AI analysis unavailable: {exc})"
        return fb
