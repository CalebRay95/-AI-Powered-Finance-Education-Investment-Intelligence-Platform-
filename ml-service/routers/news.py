"""
News Intelligence router — GET /news/live

Fetches headlines from the free Google News RSS feed (no API key required),
scores each with VADER sentiment, and correlates with yfinance 1-day price
changes per ticker.
Registered in main.py with prefix="/news".
"""

from __future__ import annotations

import asyncio
import threading
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape

from typing import Any

import httpx
import pandas as pd
import yfinance as yf
from fastapi import APIRouter, HTTPException
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

router = APIRouter()
_analyzer = SentimentIntensityAnalyzer()
_finbert_pipeline: Any = None
_finbert_lock = threading.Lock()
_finbert_skip = False          # set True when warm-up times out / errors

# Google News RSS — no API key needed
GNEWS_RSS = "https://news.google.com/rss/search"

# ── Ticker keyword map ────────────────────────────────────────────────────────
TICKER_KEYWORDS: dict[str, list[str]] = {
    "AAPL":  ["apple", "iphone", "ipad", "macbook", "tim cook"],
    "TSLA":  ["tesla", "elon", "musk", "electric vehicle", "cybertruck"],
    "MSFT":  ["microsoft", "windows", "azure", "copilot", "satya nadella"],
    "GOOGL": ["google", "alphabet", "gemini", "youtube", "android"],
    "AMZN":  ["amazon", "aws", "prime", "jeff bezos"],
    "META":  ["meta", "facebook", "instagram", "whatsapp", "zuckerberg"],
    "NVDA":  ["nvidia", "gpu", "cuda", "jensen huang"],
    "NFLX":  ["netflix", "streaming"],
    "JPM":   ["jpmorgan", "jp morgan", "jamie dimon"],
    "INFY.NS":       ["infosys", "infy"],
    "TCS.NS":        ["tcs", "tata consultancy"],
    "RELIANCE.NS":   ["reliance", "ambani"],
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _score_text(headline: str, description: str | None) -> tuple[str, float]:
    text = f"{headline}. {description or ''}"
    compound = _analyzer.polarity_scores(text)["compound"]
    if compound > 0.05:
        sentiment = "positive"
    elif compound < -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    return sentiment, round(compound, 4)


def _get_finbert():
    """Lazy-load the FinBERT pipeline once per process lifetime (thread-safe)."""
    global _finbert_pipeline
    if _finbert_pipeline is None:          # fast path — no lock needed after init
        with _finbert_lock:
            if _finbert_pipeline is None:  # second check inside lock
                from transformers import pipeline as hf_pipeline  # lazy — optional dep
                _finbert_pipeline = hf_pipeline(
                    "text-classification",
                    model="ProsusAI/finbert",
                    truncation=True,
                    max_length=512,
                )
    return _finbert_pipeline


def _finbert_score(text: str) -> tuple[str, float]:
    """Run FinBERT on *text* and return (LABEL, signed_confidence)."""
    result = _get_finbert()(text[:512])
    item = result[0]
    label: str = item["label"].upper()
    raw_score = float(item["score"])
    if label == "POSITIVE":
        signed = raw_score
    elif label == "NEGATIVE":
        signed = -raw_score
    else:
        signed = 0.0
    return label, round(signed, 4)


def _safe_finbert_score(text: str) -> tuple[str, float]:
    """Wrapper around _finbert_score that catches all errors and returns a
    neutral fallback, so a FinBERT failure never aborts the /news/live response."""
    if _finbert_skip:
        return "NEUTRAL", 0.0
    try:
        return _finbert_score(text)
    except Exception:
        return "NEUTRAL", 0.0


def _match_ticker(headline: str, allowed: set[str] | None) -> str | None:
    lower = headline.lower()
    for ticker, keywords in TICKER_KEYWORDS.items():
        if allowed and ticker not in allowed:
            continue
        if any(kw in lower for kw in keywords):
            return ticker
    return None


def _parse_rss(xml_text: str) -> list[dict]:
    """Parse Google News RSS XML into a list of article dicts."""
    root = ET.fromstring(xml_text)
    channel = root.find("channel")
    if channel is None:
        return []

    articles = []
    for item in channel.findall("item"):
        title_el = item.find("title")
        link_el  = item.find("link")
        pub_el   = item.find("pubDate")
        src_el   = item.find("source")
        desc_el  = item.find("description")

        headline = unescape(title_el.text or "") if title_el is not None else ""
        # Google News titles often contain " - Source Name" at the end; strip it
        if " - " in headline:
            headline, _, _ = headline.rpartition(" - ")

        pub_iso: str | None = None
        if pub_el is not None and pub_el.text:
            try:
                pub_iso = parsedate_to_datetime(pub_el.text).isoformat()
            except Exception:
                pub_iso = pub_el.text

        articles.append({
            "title":       headline.strip(),
            "url":         link_el.text.strip() if link_el is not None else None,
            "publishedAt": pub_iso,
            "source":      src_el.text.strip() if src_el is not None else None,
            "description": unescape(desc_el.text or "") if desc_el is not None else None,
        })
    return articles


def _price_impact(ticker: str) -> float | None:
    try:
        df = yf.download(ticker, period="2d", interval="1d", progress=False, auto_adjust=True)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        if len(df) < 2:
            return None
        prev_close = float(df["Close"].iloc[-2])
        last_close = float(df["Close"].iloc[-1])
        return round((last_close - prev_close) / prev_close * 100, 4)
    except Exception:
        return None


async def _fetch_price_impacts(tickers: set[str]) -> dict[str, float | None]:
    async def _one(ticker: str) -> tuple[str, float | None]:
        result = await asyncio.to_thread(_price_impact, ticker)
        return ticker, result

    pairs = await asyncio.gather(*(_one(t) for t in tickers))
    return dict(pairs)


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/live", summary="Fetch & analyse live financial news")
async def live_news(
    query: str = "stock market finance",
    tickers: str | None = None,
):
    """
    Fetches the latest financial headlines from the free Google News RSS feed
    (no API key required), scores each article with VADER sentiment, and
    correlates to yfinance 1-day price changes.

    - **query**: Search query (default: "stock market finance")
    - **tickers**: Optional comma-separated list of tickers to restrict keyword matching
    """
    allowed_tickers: set[str] | None = (
        {t.strip().upper() for t in tickers.split(",")} if tickers else None
    )

    # ── Fetch RSS from Google News ────────────────────────────────────────────
    params = {"q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"}
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0 Safari/537.36"
        )
    }

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(GNEWS_RSS, params=params, headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"RSS fetch failed: {exc}") from exc

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Google News RSS returned {resp.status_code}",
        )

    try:
        raw_articles = _parse_rss(resp.text)
    except ET.ParseError as exc:
        raise HTTPException(status_code=502, detail=f"RSS parse error: {exc}") from exc

    # ── Score articles (VADER) & collect unique tickers ─────────────────────
    interim = []
    unique_tickers: set[str] = set()
    for art in raw_articles:
        headline = art["title"]
        description = art["description"]
        sentiment, score = _score_text(headline, description)
        related_ticker = _match_ticker(headline, allowed_tickers)
        if related_ticker:
            unique_tickers.add(related_ticker)
        interim.append((art, headline, sentiment, score, related_ticker))

    # ── Run FinBERT inference + price impact fetches in parallel ──────────────
    # Try to warm up FinBERT once — but never let it block the response.
    # If transformers is not installed or model load times out the route
    # continues with VADER-only scores (finbert_label = "NEUTRAL", score = 0).
    global _finbert_skip
    if not _finbert_skip:
        try:
            await asyncio.wait_for(asyncio.to_thread(_get_finbert), timeout=10.0)
        except Exception:
            _finbert_skip = True  # don't retry per-article — skip all FinBERT calls

    finbert_coros = [
        asyncio.to_thread(
            _safe_finbert_score,
            f"{art['title']}. {art['description'] or ''}",
        )
        for art, headline, sentiment, score, related_ticker in interim
    ]
    finbert_results, price_map = await asyncio.gather(
        asyncio.gather(*finbert_coros),
        _fetch_price_impacts(unique_tickers),
    )

    # ── Assemble final results ────────────────────────────────────────────────
    results = []
    for (art, headline, sentiment, score, related_ticker), (fb_label, fb_score) in zip(
        interim, finbert_results
    ):
        price_impact = price_map.get(related_ticker) if related_ticker else None
        market_impact_score = (
            round(fb_score * price_impact, 4)
            if (fb_score is not None and price_impact is not None)
            else None
        )
        results.append(
            {
                "headline":          headline,
                "title":             headline,       # alias used by Dashboard.jsx
                "url":               art["url"],
                "publishedAt":       art["publishedAt"],
                "source":            art["source"],
                "sentiment":         sentiment,
                "score":             score,
                "vader_score":       score,
                "finbert_label":     fb_label,
                "finbert_score":     fb_score,
                "relatedTicker":     related_ticker,
                "priceImpact":       price_impact,
                "marketImpactScore": market_impact_score,
            }
        )

    return {
        "query":     query,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "count":     len(results),
        "articles":  results,
    }
