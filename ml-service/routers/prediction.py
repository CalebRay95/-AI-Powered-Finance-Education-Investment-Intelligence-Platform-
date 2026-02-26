"""
Prediction router — GET /prediction/predict/{ticker}

Uses the CSV-trained LinearRegression model (R² ≈ 99.85 %) to predict
the next-day closing price for FAANG tickers:
    AAPL · AMZN · GOOGL · META · MSFT · NVDA
"""

from datetime import datetime

import yfinance as yf
from fastapi import APIRouter, HTTPException

from models.stock_model import StockPredictor

router = APIRouter()
_predictor = StockPredictor()


@router.get(
    "/predict/{ticker}",
    summary="Predict next-day close price for a FAANG ticker",
    response_description="Predicted price, direction, R² accuracy and explanation",
)
async def predict_stock(ticker: str):
    """
    Returns an AI-generated **next-day closing price** prediction for the
    given FAANG ticker symbol, along with:

    - **predicted_price** — LinearRegression forecast for the next trading day
    - **current_price** — last known closing price from the dataset
    - **direction** — `UP` or `DOWN` relative to current price
    - **r2_score** — model accuracy on the 20 % hold-out set (e.g. 99.85 %)
    - **explanation** — top-3 features driving this prediction

    **Supported tickers:** `AAPL`, `AMZN`, `GOOGL`, `META`, `MSFT`, `NVDA`
    """
    try:
        result = _predictor.predict(ticker)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed for '{ticker.upper()}': {exc}",
        ) from exc

    return result


@router.get("/chart/{ticker}", summary="Get 30-day OHLCV data for price chart")
async def get_chart_data(ticker: str):
    """
    Returns the last 30 days of daily OHLCV data for the given ticker.
    Uses the bundled CSV for FAANG tickers (faster, offline), falls back to yfinance.
    """
    ticker_upper = ticker.upper()

    # ── 1. Try the bundled FAANG CSV first ──────────────────────────────────
    try:
        from models.stock_model import _FULL_DF
        if not _FULL_DF.empty and ticker_upper in _FULL_DF["Ticker"].values:
            df_ticker = _FULL_DF[_FULL_DF["Ticker"] == ticker_upper].copy()
            df_ticker = df_ticker.sort_values("Date").tail(30)
            records = []
            for _, row in df_ticker.iterrows():
                records.append({
                    "date":   str(row["Date"])[:10],
                    "open":   round(float(row["Open"]),   4),
                    "high":   round(float(row["High"]),   4),
                    "low":    round(float(row["Low"]),    4),
                    "close":  round(float(row["Close"]),  4),
                    "volume": int(row["Volume"]),
                })
            if records:
                return records
    except Exception:
        pass  # fall through to yfinance

    # ── 2. yfinance for any other ticker ────────────────────────────────────
    try:
        df = yf.download(ticker_upper, period="35d", interval="1d", progress=False)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for '{ticker_upper}'")

        if isinstance(df.columns, __import__("pandas").MultiIndex):
            df.columns = df.columns.get_level_values(0)

        records = []
        for idx, row in df.tail(30).iterrows():
            records.append({
                "date":   idx.strftime("%Y-%m-%d"),
                "open":   round(float(row["Open"]),   4),
                "high":   round(float(row["High"]),   4),
                "low":    round(float(row["Low"]),    4),
                "close":  round(float(row["Close"]),  4),
                "volume": int(row["Volume"]),
            })
        return records
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Chart data fetch failed for '{ticker_upper}': {exc}",
        ) from exc

