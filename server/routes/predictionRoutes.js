/**
 * Prediction Routes — /api/prediction
 *
 * All routes are protected by the JWT `protect` middleware.
 *
 * GET   /api/prediction/ai/:ticker    — proxy to ML service predict endpoint
 * POST  /api/prediction/submit        — full prediction flow (AI + outcome + LLM)
 *   resolvedAt is set at creation time when actualOutcome is already UP/DOWN/FLAT;
 *   it is left unset only for truly PENDING predictions.
 *   `resolvedAt` is therefore authoritative for any resolved prediction record,
 *   regardless of whether it was resolved at submit or via PATCH /:id/resolve.
 * GET   /api/prediction/history       — last 20 predictions for the current user
 * PATCH /api/prediction/:id/resolve   — resolve a PENDING prediction on demand
 */

import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Prediction from '../models/Prediction.js';
import User from '../models/User.js';

const router = express.Router();

const ML_BASE = () => process.env.ML_SERVICE_URL || 'http://localhost:8000';

/** Thin wrapper: fetch from ML service, throw on non-2xx. */
async function mlFetch(path, options = {}) {
  const res = await fetch(`${ML_BASE()}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ML service ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── GET /api/prediction/ai/:ticker ────────────────────────────────────────────
router.get('/ai/:ticker', protect, async (req, res) => {
  const { ticker } = req.params;
  const data = await mlFetch(`/prediction/predict/${encodeURIComponent(ticker.toUpperCase())}`);
  res.json(data);
});

// ── POST /api/prediction/submit ───────────────────────────────────────────────
router.post('/submit', protect, async (req, res) => {
  const {
    ticker,
    userPrediction,
    // Optional: pre-fetched AI data from the client (avoids a redundant ML call).
    // If all three are supplied the server skips Step 1 entirely.
    aiPrediction:    inboundAiPrediction,
    confidence:      inboundConfidence,
    featureImportance: inboundFeatureImportance,
  } = req.body;

  // Validate
  if (!ticker || !userPrediction) {
    return res.status(400).json({ message: 'ticker and userPrediction are required.' });
  }
  if (!['UP', 'DOWN'].includes(userPrediction)) {
    return res.status(400).json({ message: "userPrediction must be 'UP' or 'DOWN'." });
  }

  const sym = ticker.toUpperCase();

  // ── Step 1: AI prediction (skip if pre-fetched data was provided) ──────────
  const hasInbound =
    inboundAiPrediction != null &&
    inboundConfidence   != null &&
    inboundFeatureImportance != null;

  let aiPrediction, confidence, featureImportance;
  if (hasInbound) {
    aiPrediction      = inboundAiPrediction;
    confidence        = inboundConfidence;
    featureImportance = inboundFeatureImportance;
  } else {
    const aiData     = await mlFetch(`/prediction/predict/${encodeURIComponent(sym)}`);
    aiPrediction     = aiData.aiPrediction   ?? 'NEUTRAL';
    confidence       = aiData.confidence     ?? 0;
    featureImportance = aiData.featureImportance ?? {};
  }

  // ── Step 2: Actual outcome via chart data ──────────────────────────────────
  const chartData = await mlFetch(`/prediction/chart/${encodeURIComponent(sym)}`);

  let actualOutcome  = 'PENDING';
  let priceChangePct = null;

  if (Array.isArray(chartData) && chartData.length >= 2) {
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    if (last?.close != null && prev?.close != null && prev.close !== 0) {
      priceChangePct = ((last.close - prev.close) / prev.close) * 100;
      if (priceChangePct > 0.1)       actualOutcome = 'UP';
      else if (priceChangePct < -0.1) actualOutcome = 'DOWN';
      else                            actualOutcome = 'FLAT';
    }
  }

  // ── Step 3: LLM explanation ────────────────────────────────────────────────
  const explainPayload = {
    ticker: sym,
    userPrediction,
    aiPrediction,
    actualOutcome,
    confidence,
    priceChangePct,
    featureImportance,
  };

  let explanation = '';
  try {
    const explainData = await mlFetch('/explanation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(explainPayload),
    });
    explanation = explainData.explanation ?? '';
  } catch (_) {
    // Explanation failure is non-fatal — save the prediction without it
  }

  // ── Step 4: Persist ────────────────────────────────────────────────────────
  // Set resolvedAt immediately when the outcome is already known so that
  // `resolvedAt` is authoritative for all resolved records, not just those
  // resolved later via PATCH /:id/resolve.
  const prediction = await Prediction.create({
    userId: req.user._id,
    ticker: sym,
    userPrediction,
    aiPrediction,
    confidence,
    actualOutcome,
    explanation,
    priceChangePct,
    featureImportance,
    ...(actualOutcome !== 'PENDING' && { resolvedAt: new Date() }),
  });

  await User.findByIdAndUpdate(req.user._id, {
    $push: { predictionHistory: prediction._id },
  });

  res.status(201).json(prediction);
});

// ── GET /api/prediction/history ───────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  const history = await Prediction.find({ userId: req.user._id })
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();
  res.json(history);
});

// ── PATCH /api/prediction/:id/resolve ────────────────────────────────────────
router.patch('/:id/resolve', protect, async (req, res) => {
  const prediction = await Prediction.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!prediction) {
    return res.status(404).json({ message: 'Prediction not found.' });
  }
  if (prediction.actualOutcome !== 'PENDING') {
    return res.status(400).json({ message: 'Prediction already resolved.' });
  }

  // Re-fetch chart data to compute the current actual outcome
  const chartData = await mlFetch(
    `/prediction/chart/${encodeURIComponent(prediction.ticker)}`,
  );

  let actualOutcome  = 'PENDING';
  let priceChangePct = null;

  if (Array.isArray(chartData) && chartData.length >= 2) {
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    if (last?.close != null && prev?.close != null && prev.close !== 0) {
      priceChangePct = ((last.close - prev.close) / prev.close) * 100;
      if (priceChangePct > 0.1)       actualOutcome = 'UP';
      else if (priceChangePct < -0.1) actualOutcome = 'DOWN';
      else                            actualOutcome = 'FLAT';
    }
  }

  // Market data not yet sufficient — ask client to retry
  if (actualOutcome === 'PENDING') {
    return res.status(202).json({ message: 'Market data not yet available.' });
  }

  // Build explanation payload from existing doc fields + freshly computed values
  const explainPayload = {
    ticker:           prediction.ticker,
    userPrediction:   prediction.userPrediction,
    aiPrediction:     prediction.aiPrediction,
    actualOutcome,
    confidence:       prediction.confidence,
    priceChangePct,
    featureImportance: prediction.featureImportance,
  };

  // Start from empty — never carry forward a stale pre-resolution explanation.
  // If regeneration fails, the resolved record persists an empty explanation
  // rather than rationale that no longer matches the newly computed outcome.
  let explanation = '';
  try {
    const explainData = await mlFetch('/explanation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(explainPayload),
    });
    explanation = explainData.explanation ?? '';
  } catch (_) {
    // Explanation failure is non-fatal; explanation stays empty
  }

  const updated = await Prediction.findByIdAndUpdate(
    req.params.id,
    { actualOutcome, priceChangePct, explanation, resolvedAt: new Date() },
    { new: true },
  );

  res.json(updated);
});

export default router;
