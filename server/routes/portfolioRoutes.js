/**
 * Portfolio Routes — /api/portfolio
 *
 * All routes protected by the JWT `protect` middleware.
 *
 * GET  /api/portfolio/:userId       — fetch stored portfolio
 * POST /api/portfolio/holdings      — save/update holdings (draft, no analysis)
 * POST /api/portfolio/analyze       — full pipeline: prices → C++ → AI → persist
 */

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Portfolio from '../models/Portfolio.js';
import {
  calculateVaR,
  calculateSharpeRatio,
  calculateBeta,
  runMonteCarlo,
  runBacktest,
} from '../services/coreEngine.js';

const router = express.Router();

const ML_BASE = () => process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Ticker alias map — normalises common company names → exchange symbols ─────
const TICKER_ALIAS = {
  // US stocks
  AMAZON: 'AMZN', APPLE: 'AAPL', TESLA: 'TSLA',
  MICROSOFT: 'MSFT', GOOGLE: 'GOOGL', ALPHABET: 'GOOGL',
  FACEBOOK: 'META', NETFLIX: 'NFLX', NVIDIA: 'NVDA',
  // Common Indian tickers that sometimes get full names
  INFOSYS: 'INFY', WIPRO: 'WIPRO.NS', RELIANCE: 'RELIANCE.NS',
  TCS: 'TCS.NS', HCL: 'HCLTECH.NS', HDFC: 'HDFCBANK.NS',
};

/** Normalise a ticker string: uppercase + resolve common company-name aliases. */
function normalizeTicker(raw) {
  const upper = String(raw || '').trim().toUpperCase();
  return TICKER_ALIAS[upper] ?? upper;
}

/** Thin wrapper: fetch from ML service, throw on non-2xx. */
async function mlFetch(path, options = {}) {
  const res = await fetch(`${ML_BASE()}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ML service ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Compute per-period returns from a close-price array. */
function toReturns(closes) {
  const rets = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] !== 0) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  return rets;
}

// ── GET /api/portfolio/:userId ────────────────────────────────────────────────
router.get('/:userId', protect, async (req, res) => {
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  const portfolio = await Portfolio.findOne({ userId: req.params.userId }).lean();
  if (!portfolio) return res.status(404).json({ message: 'No portfolio found.' });
  res.json(portfolio);
});

// ── POST /api/portfolio/holdings ──────────────────────────────────────────────
router.post('/holdings', protect, async (req, res) => {
  const { holdings } = req.body;

  if (!Array.isArray(holdings) || holdings.length === 0) {
    return res.status(400).json({ message: 'holdings array is required.' });
  }

  const sanitized = [];
  for (const h of holdings) {
    const ticker      = normalizeTicker(h.ticker);
    const shares      = Number(h.shares);
    const avgBuyPrice = Number(h.avgBuyPrice);
    if (
      !ticker ||
      !Number.isFinite(shares)      || shares      <= 0 ||
      !Number.isFinite(avgBuyPrice) || avgBuyPrice <= 0
    ) {
      return res.status(400).json({
        message: `Invalid holding: ticker="${ticker}", shares=${shares}, avgBuyPrice=${avgBuyPrice}. ` +
                 'shares and avgBuyPrice must be finite positive numbers.',
      });
    }
    sanitized.push({ ticker, shares, avgBuyPrice });
  }

  const portfolio = await Portfolio.findOneAndUpdate(
    { userId: req.user._id },
    { holdings: sanitized },
    { upsert: true, new: true },
  );
  res.json(portfolio);
});

// ── POST /api/portfolio/analyze ───────────────────────────────────────────────
router.post('/analyze', protect, async (req, res) => {
  // ── Step 1: Resolve holdings ──────────────────────────────────────────────
  let rawHoldings = req.body.holdings;
  if (!rawHoldings || rawHoldings.length === 0) {
    const stored = await Portfolio.findOne({ userId: req.user._id }).lean();
    if (!stored || !stored.holdings?.length) {
      return res.status(400).json({ message: 'No holdings provided or saved.' });
    }
    rawHoldings = stored.holdings;
  }

  const sanitizedHoldings = [];
  for (const h of rawHoldings) {
    const ticker      = normalizeTicker(h.ticker);
    const shares      = Number(h.shares);
    const avgBuyPrice = Number(h.avgBuyPrice);
    if (
      !ticker ||
      !Number.isFinite(shares)      || shares      <= 0 ||
      !Number.isFinite(avgBuyPrice) || avgBuyPrice <= 0
    ) {
      return res.status(400).json({
        message: `Invalid holding: ticker="${ticker}", shares=${shares}, avgBuyPrice=${avgBuyPrice}. ` +
                 'shares and avgBuyPrice must be finite positive numbers.',
      });
    }
    sanitizedHoldings.push({ ticker, shares, avgBuyPrice });
  }

  // ── Step 2: Fetch 30-day price histories (all tickers + SPY in parallel) ──
  const uniqueTickers = [...new Set(sanitizedHoldings.map((h) => h.ticker))];
  const allTickers    = [...uniqueTickers, 'SPY'];

  const chartResults = await Promise.allSettled(
    allTickers.map((t) => mlFetch(`/prediction/chart/${encodeURIComponent(t)}`)),
  );

  /** @type {Record<string, {date:string, close:number}[]>} */
  const chartMap = {};
  allTickers.forEach((ticker, i) => {
    const r = chartResults[i];
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      chartMap[ticker] = r.value;
    } else {
      chartMap[ticker] = [];
    }
  });

  // ── Step 3: Compute per-holding dailyReturns + currentPrice/currentValue ──
  const enriched = sanitizedHoldings.map((h) => {
    const bars         = chartMap[h.ticker] ?? [];
    const closes       = bars.map((b) => b.close);
    const dailyReturns = toReturns(closes);
    const currentPrice = closes.length ? closes[closes.length - 1] : h.avgBuyPrice;
    const currentValue = h.shares * currentPrice;
    return { ...h, currentPrice, currentValue, dailyReturns, closes, dates: bars.map((b) => b.date) };
  });

  // ── Step 4: Compute weights and portfolio-level weighted returns ───────────
  const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0) || 1;
  const totalCost  = enriched.reduce((s, h) => s + h.shares * h.avgBuyPrice, 0);

  enriched.forEach((h) => { h.weight = (h.currentValue / totalValue) * 100; });

  // Align to shortest return series
  const minLen = Math.min(
    ...enriched.map((h) => h.dailyReturns.length),
    (chartMap['SPY'] ?? []).length - 1,
  );

  const portfolioReturns = [];
  for (let i = 0; i < minLen; i++) {
    const dayReturn = enriched.reduce(
      (s, h) => s + (h.weight / 100) * (h.dailyReturns[i] ?? 0),
      0,
    );
    portfolioReturns.push(dayReturn);
  }

  const spyCloses  = (chartMap['SPY'] ?? []).map((b) => b.close);
  const spyReturns = toReturns(spyCloses).slice(0, minLen);

  // ── Compute performance series (needed by backtest + final response) ──────
  // Use the holding with the MOST price history so the chart is never empty
  // (holdings without chart data fall back to their currentPrice for missing bars)
  const longestDates = enriched.reduce(
    (acc, h) => (h.dates.length > acc.length ? h.dates : acc),
    enriched[0]?.dates ?? [],
  );

  const performanceSeries = longestDates.map((date, i) => ({
    date,
    value: enriched.reduce(
      (s, h) => s + h.shares * (h.closes[i] ?? h.currentPrice),
      0,
    ),
  }));

  // Derive daily drift (mu) and volatility (sigma) from portfolio returns
  const mu = portfolioReturns.length
    ? portfolioReturns.reduce((s, r) => s + r, 0) / portfolioReturns.length
    : 0;
  const sigma = portfolioReturns.length >= 2
    ? Math.sqrt(
        portfolioReturns.reduce((s, r) => s + (r - mu) ** 2, 0) / portfolioReturns.length,
      )
    : 0;

  // ── Step 5: C++ engine metrics ────────────────────────────────────────────────────────
  let var95 = 0, sharpeRatio = 0, beta = 0;
  let mcResult = null, backtestResult = null;
  if (portfolioReturns.length >= 2) {
    const backtestValues = performanceSeries.map((p) => p.value);
    [var95, sharpeRatio, beta, mcResult, backtestResult] = await Promise.all([
      calculateVaR(portfolioReturns, 0.95).catch(() => 0),
      calculateSharpeRatio(portfolioReturns, 0.0001).catch(() => 0),
      spyReturns.length >= 2
        ? calculateBeta(portfolioReturns, spyReturns).catch(() => 0)
        : Promise.resolve(0),
      runMonteCarlo(totalValue, mu, sigma, 30, 500).catch(() => null),
      backtestValues.length >= 20
        ? runBacktest(backtestValues, 5, 20).catch(() => null)
        : Promise.resolve(null),
    ]);
  }

  // Derive Monte Carlo percentiles from sorted final-price distribution
  let monteCarloPercentiles = null;
  if (Array.isArray(mcResult) && mcResult.length > 0) {
    const sorted = [...mcResult].sort((a, b) => a - b);
    const p5  = sorted[Math.floor(0.05 * (sorted.length - 1))];
    const p50 = sorted[Math.floor(0.50 * (sorted.length - 1))];
    const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))];
    monteCarloPercentiles = { p5, p50, p95 };
  }

  // ── Step 6: Summary metrics ───────────────────────────────────────────────
  const totalReturnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  const riskScore      = Math.min(
    100,
    Math.round(Math.abs(var95) * 1000 + Math.max(0, beta - 1) * 20),
  );

  // ── Step 7: AI narrative ──────────────────────────────────────────────────
  const holdingsForAI = enriched.map(({ closes: _c, dates: _d, dailyReturns: _r, ...rest }) => rest);

  let aiNarrative = '', allocationInsights = '', recommendations = '';
  try {
    const aiRes = await mlFetch('/portfolio/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holdings: holdingsForAI,
        totalValue, totalCost, totalReturnPct,
        sharpeRatio, var95, beta, riskScore,
      }),
    });
    aiNarrative        = aiRes.narrative        ?? '';
    allocationInsights = aiRes.allocationInsights ?? '';
    recommendations    = aiRes.recommendations   ?? '';
  } catch (_) { /* non-fatal */ }

  // ── Step 8: Persist (without ephemeral fields) ────────────────────────────
  const persistHoldings = enriched.map(
    ({ closes: _c, dates: _d, ...rest }) => rest,
  );

  const saved = await Portfolio.findOneAndUpdate(
    { userId: req.user._id },
    {
      holdings:           persistHoldings,
      totalValue,         totalCost,        totalReturnPct,
      sharpeRatio,        var95,            beta,           riskScore,
      monteCarloPercentiles,
      backtestResult,
      aiNarrative,        allocationInsights, recommendations,
      lastAnalyzed:       new Date(),
    },
    { upsert: true, new: true },
  );

  // ── Step 9: Return with performance time-series (transient — not persisted) ─
  return res.json({ ...saved.toObject(), performanceSeries });
});

export default router;
