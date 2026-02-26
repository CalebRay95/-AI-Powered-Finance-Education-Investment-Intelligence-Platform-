"""
StockPredictor — XGBoost + LSTM Ensemble Next-Day Close price predictor.

Dataset : ml-service/data/faang_stock_prices.csv
          (AAPL, AMZN, GOOGL, META, MSFT, NVDA — 2016-2026, ~2 500 rows/ticker)
          OR yfinance 5Y daily download for any other ticker.
Features: Open, High, Low, Close, Volume,
          SMA_7, SMA_21, EMA_12, EMA_26,
          RSI_14, MACD, MACD_Signal,
          Bollinger_Upper, Bollinger_Lower,
          Daily_Return, Volatility_7d
Target  : Next_Day_Close  (regression)
Models  :
  XGBoost  — trained on all FEATURE_COLS with StandardScaler (R² ≥ 99 % typical)
  LSTM     — 20-step Close-price sequence model (MinMaxScaler, 64 units, 30 epochs)
  Ensemble — 0.6 × XGBoost + 0.4 × LSTM

Concurrency
-----------
- Per-ticker threading.Lock  → only one request trains at a time.
- In-memory cache (TTL=5 min) → subsequent concurrent calls get instant results.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.metrics import r2_score

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR  = Path(__file__).parent
SAVED_DIR = BASE_DIR / "saved"
CSV_PATH  = BASE_DIR.parent / "data" / "faang_stock_prices.csv"
SAVED_DIR.mkdir(parents=True, exist_ok=True)

# ── Feature / target columns (match notebook exactly) ─────────────────────────
FEATURE_COLS = [
    "Open", "High", "Low", "Close", "Volume",
    "SMA_7", "SMA_21", "EMA_12", "EMA_26",
    "RSI_14", "MACD", "MACD_Signal",
    "Bollinger_Upper", "Bollinger_Lower",
    "Daily_Return", "Volatility_7d",
]
TARGET_COL  = "Next_Day_Close"
LSTM_WINDOW = 20


# ── Load full dataset once at module level (fast subsequent access) ────────────
def _load_csv() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH, parse_dates=["Date"])
    df.sort_values("Date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


try:
    _FULL_DF: pd.DataFrame = _load_csv()
except FileNotFoundError:
    _FULL_DF = pd.DataFrame()


# ── Feature engineering from a raw OHLCV DataFrame ────────────────────────────

def _add_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Given a DataFrame with columns [Date, Open, High, Low, Close, Volume],
    compute all FEATURE_COLS and the TARGET_COL in place.
    Drops rows with NaN (warm-up period for rolling windows).
    """
    df = df.sort_values("Date").copy()

    close = df["Close"]

    # Moving averages
    df["SMA_7"]  = close.rolling(7).mean()
    df["SMA_21"] = close.rolling(21).mean()
    df["EMA_12"] = close.ewm(span=12, adjust=False).mean()
    df["EMA_26"] = close.ewm(span=26, adjust=False).mean()

    # MACD
    df["MACD"]        = df["EMA_12"] - df["EMA_26"]
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    # RSI-14
    delta  = close.diff()
    gain   = delta.clip(lower=0).rolling(14).mean()
    loss   = (-delta.clip(upper=0)).rolling(14).mean()
    rs     = gain / loss.replace(0, float("nan"))
    df["RSI_14"] = 100 - (100 / (1 + rs))

    # Bollinger Bands (20-period)
    sma20       = close.rolling(20).mean()
    std20       = close.rolling(20).std()
    df["Bollinger_Upper"] = sma20 + 2 * std20
    df["Bollinger_Lower"] = sma20 - 2 * std20

    # Returns & volatility
    df["Daily_Return"]  = close.pct_change()
    df["Volatility_7d"] = df["Daily_Return"].rolling(7).std()

    # Target: next day's close (used only for training)
    df[TARGET_COL] = close.shift(-1)

    df.dropna(subset=FEATURE_COLS + [TARGET_COL], inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def _fetch_yf_df(ticker: str) -> pd.DataFrame:
    """
    Download ~5 years of daily OHLCV data from yfinance for *ticker*,
    compute all technical features and return a training-ready DataFrame.
    Raises ValueError if no data is returned (invalid ticker).
    """
    import yfinance as yf  # lazy import — already listed in requirements.txt

    raw = yf.download(ticker, period="5y", interval="1d", progress=False, auto_adjust=True)
    if raw.empty:
        raise ValueError(
            f"No data found for ticker '{ticker}'. "
            "Please enter a valid exchange-listed ticker symbol (e.g. AAPL, TSLA, NVDA)."
        )

    # Flatten MultiIndex columns produced by yfinance for single-ticker downloads
    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)

    raw = raw.reset_index()
    raw.rename(columns={"index": "Date"}, inplace=True)
    if "Date" not in raw.columns and raw.index.name == "Date":
        raw = raw.reset_index()

    # Keep only the columns we need
    for col in ["Open", "High", "Low", "Close", "Volume"]:
        if col not in raw.columns:
            raise ValueError(f"yfinance response missing column '{col}' for {ticker}")

    raw["Date"] = pd.to_datetime(raw["Date"])
    df = raw[["Date", "Open", "High", "Low", "Close", "Volume"]].copy()
    for col in ["Open", "High", "Low", "Close"]:
        df[col] = df[col].astype(float)
    df["Volume"] = df["Volume"].astype(float)

    return _add_features(df)


class StockPredictor:
    # ── Concurrency controls ───────────────────────────────────────────────────
    _locks: dict[str, threading.Lock] = defaultdict(threading.Lock)
    _cache: dict[str, dict]           = {}
    _CACHE_TTL                        = 300   # 5 minutes

    # ── Internal helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _ticker_df(ticker: str) -> tuple[pd.DataFrame, str]:
        """
        Return (df, source) for *ticker*.

        source is:
          'csv'     — data from the bundled FAANG CSV (fast, offline)
          'yfinance' — dynamically downloaded from Yahoo Finance (any ticker)

        Raises ValueError if neither source has data.
        """
        # 1. Try the bundled CSV first (fastest path for FAANG tickers)
        if not _FULL_DF.empty:
            csv_df = _FULL_DF[_FULL_DF["Ticker"] == ticker.upper()].copy()
            if not csv_df.empty:
                return csv_df, "csv"

        # 2. Fall back to yfinance for any other ticker
        yf_df = _fetch_yf_df(ticker)
        return yf_df, "yfinance"

    @staticmethod
    def _train_xgb_model(df: pd.DataFrame):
        """Train XGBRegressor on ticker data, return (model, scaler, r2)."""
        import xgboost as xgb  # lazy import

        X = df[FEATURE_COLS].values
        y = df[TARGET_COL].values

        # Chronological 80/20 split (no shuffle — preserves time ordering)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )

        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s  = scaler.transform(X_test)

        model = xgb.XGBRegressor(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            verbosity=0,
        )
        model.fit(X_train_s, y_train)

        r2 = float(r2_score(y_test, model.predict(X_test_s)))
        return model, scaler, r2

    @staticmethod
    def _train_lstm_model(df: pd.DataFrame):
        """Train a lightweight LSTM on the Close price sequence, return (model, scaler)."""
        import tensorflow as tf  # lazy import
        from tensorflow import keras

        close_vals = df["Close"].values.reshape(-1, 1).astype("float32")

        lstm_scaler = MinMaxScaler()
        scaled = lstm_scaler.fit_transform(close_vals).flatten()

        # Build sliding windows of length LSTM_WINDOW
        X_seq, y_seq = [], []
        for i in range(len(scaled) - LSTM_WINDOW):
            X_seq.append(scaled[i : i + LSTM_WINDOW])
            y_seq.append(scaled[i + LSTM_WINDOW])
        X_seq = np.array(X_seq, dtype="float32")
        y_seq = np.array(y_seq, dtype="float32")

        # Chronological 80/20 split
        split = int(len(X_seq) * 0.8)
        X_train, X_test = X_seq[:split], X_seq[split:]
        y_train, y_test = y_seq[:split], y_seq[split:]

        # Reshape to (samples, timesteps, features)
        X_train = X_train.reshape(-1, LSTM_WINDOW, 1)
        X_test  = X_test.reshape(-1, LSTM_WINDOW, 1)

        model = keras.Sequential([
            keras.layers.LSTM(64, input_shape=(LSTM_WINDOW, 1)),
            keras.layers.Dense(1),
        ])
        model.compile(optimizer="adam", loss="mse")
        model.fit(
            X_train, y_train,
            epochs=30,
            batch_size=16,
            validation_split=0.1,
            verbose=0,
        )

        return model, lstm_scaler

    # ── Public API ─────────────────────────────────────────────────────────────

    def predict(self, ticker: str) -> dict:
        ticker = ticker.upper()

        # 1. Serve from cache if still fresh
        cached = StockPredictor._cache.get(ticker)
        if cached and time.time() < cached["expires_at"]:
            return cached["result"]

        # 2. Acquire per-ticker lock (prevents duplicate simultaneous training)
        with StockPredictor._locks[ticker]:

            # 3. Double-check after acquiring lock
            cached = StockPredictor._cache.get(ticker)
            if cached and time.time() < cached["expires_at"]:
                return cached["result"]

            # 4. Load ticker data (CSV for FAANG, yfinance for everything else)
            df, source = self._ticker_df(ticker)

            # ── XGBoost block ──────────────────────────────────────────────────
            xgb_model_path  = SAVED_DIR / f"{ticker}_xgb_model.pkl"
            xgb_scaler_path = SAVED_DIR / f"{ticker}_xgb_scaler.pkl"
            xgb_r2_path     = SAVED_DIR / f"{ticker}_xgb_r2.txt"

            if xgb_model_path.exists() and xgb_scaler_path.exists():
                xgb_model  = joblib.load(xgb_model_path)
                xgb_scaler = joblib.load(xgb_scaler_path)
                r2 = float(xgb_r2_path.read_text()) if xgb_r2_path.exists() else float("nan")
            else:
                xgb_model, xgb_scaler, r2 = self._train_xgb_model(df)
                joblib.dump(xgb_model, xgb_model_path)
                joblib.dump(xgb_scaler, xgb_scaler_path)
                xgb_r2_path.write_text(str(r2))

            # ── LSTM block ─────────────────────────────────────────────────────
            lstm_model_path  = SAVED_DIR / f"{ticker}_lstm_model.keras"
            lstm_scaler_path = SAVED_DIR / f"{ticker}_lstm_scaler.pkl"

            if lstm_model_path.exists() and lstm_scaler_path.exists():
                from tensorflow import keras  # lazy import
                lstm_model  = keras.models.load_model(lstm_model_path)
                lstm_scaler = joblib.load(lstm_scaler_path)
            else:
                lstm_model, lstm_scaler = self._train_lstm_model(df)
                lstm_model.save(lstm_model_path)
                joblib.dump(lstm_scaler, lstm_scaler_path)

            # ── Inference ──────────────────────────────────────────────────────
            # XGBoost: predict from latest feature row
            last_row_scaled = xgb_scaler.transform(df[FEATURE_COLS].iloc[[-1]].values)
            xgb_pred = float(xgb_model.predict(last_row_scaled)[0])

            # LSTM: predict from last LSTM_WINDOW Close prices
            close_window = df["Close"].values[-LSTM_WINDOW:].reshape(-1, 1).astype("float32")
            close_scaled = lstm_scaler.transform(close_window).flatten()
            lstm_input   = close_scaled.reshape(1, LSTM_WINDOW, 1)
            lstm_scaled_pred = float(lstm_model.predict(lstm_input, verbose=0)[0][0])
            lstm_pred = float(lstm_scaler.inverse_transform([[lstm_scaled_pred]])[0][0])

            # Ensemble
            ensemble_pred = 0.6 * xgb_pred + 0.4 * lstm_pred

            current_price = float(df["Close"].iloc[-1])
            last_date = (
                str(df["Date"].iloc[-1].date())
                if hasattr(df["Date"].iloc[-1], "date")
                else str(df["Date"].iloc[-1])
            )

            pct_change = (ensemble_pred - current_price) / current_price
            ai_pred    = "UP" if pct_change > 0 else "DOWN"
            confidence = float(min(abs(pct_change) * 20, 0.95))

            # Feature importance from XGBoost gain (more meaningful than LR coefficients)
            raw_imp  = xgb_model.feature_importances_
            total    = raw_imp.sum() or 1.0
            feature_importance = {
                feat: round(float(raw_imp[i] / total), 6)
                for i, feat in enumerate(FEATURE_COLS)
            }

            # Explanation — top 3 by XGBoost gain
            top3_idx   = raw_imp.argsort()[::-1][:3]
            top3_total = raw_imp[top3_idx].sum() or 1.0
            top3_parts = [
                f"{FEATURE_COLS[i]} ({raw_imp[i] / top3_total:.0%})"
                for i in top3_idx
            ]
            explanation = f"Prediction driven by {', '.join(top3_parts)}"

            model_label = (
                f"XGBoost+LSTM Ensemble (FAANG CSV, R²={r2*100:.1f}%)"
                if source == "csv"
                else f"XGBoost+LSTM Ensemble (yfinance 5Y, R²={r2*100:.1f}%)"
            )

            result = {
                "ticker":            ticker,
                "last_date":         last_date,
                "current_price":     round(current_price,   4),
                "predicted_price":   round(ensemble_pred,   4),
                "pct_change":        round(pct_change * 100, 4),
                # Fields consumed by predictionRoutes.js / Playground.jsx
                "aiPrediction":      ai_pred,
                "confidence":        round(confidence, 4),
                "featureImportance": feature_importance,
                # Meta
                "r2_score":          round(r2 * 100, 4),
                "model":             model_label,
                "source":            source,
                "explanation":       explanation,
                "timestamp":         datetime.now(timezone.utc).isoformat(),
                # New additive keys (not consumed by any existing route yet)
                "xgb_prediction":      round(xgb_pred,      4),
                "lstm_prediction":     round(lstm_pred,      4),
                "ensemble_prediction": round(ensemble_pred,  4),
            }

            # 7. Cache the result
            StockPredictor._cache[ticker] = {
                "result":     result,
                "expires_at": time.time() + StockPredictor._CACHE_TTL,
            }

            return result
