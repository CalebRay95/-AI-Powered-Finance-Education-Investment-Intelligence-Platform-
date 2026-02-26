"""
Explanation router — exposes POST /explanation/generate.

Calls the Gemini API to produce a short narrative explaining a stock
prediction outcome.  Falls back to a deterministic string when
GEMINI_API_KEY is not configured so the rest of the flow never breaks.

Registered in main.py with prefix="/explanation".
Full path: POST /explanation/generate
"""

import os
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# ── Request schema ────────────────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    ticker: str
    userPrediction: str                   # "UP" | "DOWN"
    aiPrediction: str                     # "UP" | "DOWN" | "NEUTRAL"
    actualOutcome: str                    # "UP" | "DOWN" | "FLAT" | "PENDING"
    confidence: float                     # 0–1
    priceChangePct: Optional[float] = None
    featureImportance: Optional[dict] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _user_correct(req: ExplainRequest) -> bool:
    if req.actualOutcome == "PENDING":
        return False
    if req.actualOutcome == "FLAT":
        return False
    return req.userPrediction == req.actualOutcome


def _ai_correct(req: ExplainRequest) -> bool:
    if req.actualOutcome in ("PENDING", "FLAT"):
        return False
    return req.aiPrediction == req.actualOutcome


def _build_prompt(req: ExplainRequest) -> str:
    fi = req.featureImportance or {}
    fi_lines = "\n".join(
        f"  - {k}: {v:.4f}" if isinstance(v, float) else f"  - {k}: {v}"
        for k, v in list(fi.items())[:8]
    )

    user_verdict = "correct ✅" if _user_correct(req) else "incorrect ✗"
    ai_verdict   = "correct ✅" if _ai_correct(req)   else "incorrect ✗"

    price_info = (
        f"The stock moved {req.priceChangePct:+.2f}% on the day."
        if req.priceChangePct is not None
        else "Price change data is unavailable."
    )

    return f"""You are a senior financial analyst explaining a stock prediction outcome to a retail investor.

Stock: {req.ticker.upper()}
User predicted: {req.userPrediction}  →  {user_verdict}
AI predicted:   {req.aiPrediction} (confidence {req.confidence*100:.1f}%)  →  {ai_verdict}
Actual outcome: {req.actualOutcome}
{price_info}

Top feature importances used by the model:
{fi_lines if fi_lines else "  (not available)"}

Write a clear, jargon-lite explanation in exactly 3–4 sentences that:
1. States what happened to the stock price.
2. References 2–3 of the most influential technical indicators above and why they pointed in the direction they did.
3. Notes whether the user and the AI model were correct.
4. Ends with one practical takeaway for the investor.

Be factual, concise, and encouraging. Do not use markdown formatting."""


def _fallback_explanation(req: ExplainRequest) -> str:
    direction = req.actualOutcome if req.actualOutcome != "PENDING" else "an undetermined direction"
    pct = f" ({req.priceChangePct:+.2f}%)" if req.priceChangePct is not None else ""
    user_verdict = "correctly" if _user_correct(req) else "incorrectly"
    ai_verdict   = "correctly" if _ai_correct(req)   else "incorrectly"
    return (
        f"{req.ticker.upper()} moved {direction}{pct} during the observed period. "
        f"The AI model predicted {req.aiPrediction} with {req.confidence*100:.1f}% confidence and was {ai_verdict}. "
        f"You predicted {req.userPrediction} and were {user_verdict}. "
        f"Keep tracking technical indicators like RSI and MACD for more informed future predictions."
    )


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/generate", summary="Generate LLM explanation for a prediction outcome")
async def generate_explanation(body: ExplainRequest):
    """
    Generates a Gemini-powered narrative explanation for a completed stock
    prediction.  Returns ``{ "explanation": "<string>" }`` in all cases —
    uses a deterministic fallback if the API key is missing.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")

    if not api_key:
        return {"explanation": _fallback_explanation(body)}

    try:
        import google.generativeai as genai  # imported lazily so the router
                                              # loads even without the package
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(_build_prompt(body))
        explanation = response.text.strip()
    except Exception as exc:  # noqa: BLE001 — never let LLM errors break the flow
        explanation = _fallback_explanation(body) + f" (AI explanation unavailable: {exc})"

    return {"explanation": explanation}
