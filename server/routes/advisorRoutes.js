/**
 * advisorRoutes.js
 *
 * POST /api/advisor/chat
 *   - Authenticated (protect middleware)
 *   - Aggregates user's portfolio, recent prediction history, and latest news
 *     sentiment cache to build a rich context payload
 *   - Proxies to the ML service's POST /advisor/chat endpoint
 *   - Returns { reply: string, contextUsed: { portfolio, news, predictions } }
 *
 * POST /api/advisor/chat/stream
 *   - Same context aggregation as /chat
 *   - Pipes the ML service SSE stream directly to the client
 *   - Event types: context | token | done | error
 */

import express from 'express';
import { Readable } from 'node:stream';
import Portfolio from '../models/Portfolio.js';
import Prediction from '../models/Prediction.js';
import NewsCache from '../models/NewsCache.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/** Lightweight helper — POST JSON to the ML service. */
async function mlPost(path, body) {
  const res = await fetch(`${ML_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`ML service error: ${res.status} ${text}`);
    err.statusCode = 502;
    throw err;
  }
  return res.json();
}

// ── POST /api/advisor/chat ────────────────────────────────────────────────────
router.post('/chat', protect, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'message is required and must be a non-empty string.' });
  }

  const userId = req.user._id;

  // Fetch all context sources in parallel — failures are non-fatal
  const [portfolioResult, predictionsResult, newsResult] = await Promise.allSettled([
    Portfolio.findOne({ userId }).lean(),
    Prediction.find({ userId }).sort({ timestamp: -1 }).limit(5).lean(),
    NewsCache.findOne().sort({ fetchedAt: -1 }).lean(),
  ]);

  // ── Build lean context (strip heavy dailyReturns arrays) ─────────────────
  let portfolio = null;
  if (portfolioResult.status === 'fulfilled' && portfolioResult.value) {
    const raw = portfolioResult.value;
    portfolio = {
      totalValue: raw.totalValue,
      totalCost: raw.totalCost,
      totalReturnPct: raw.totalReturnPct,
      sharpeRatio: raw.sharpeRatio,
      var95: raw.var95,
      beta: raw.beta,
      riskScore: raw.riskScore,
      aiNarrative: raw.aiNarrative,
      allocationInsights: raw.allocationInsights,
      recommendations: raw.recommendations,
      holdings: (raw.holdings || []).map(({ ticker, shares, avgBuyPrice, currentPrice, currentValue, weight }) => ({
        ticker, shares, avgBuyPrice, currentPrice, currentValue, weight,
      })),
      monteCarloPercentiles: raw.monteCarloPercentiles ?? null,
      backtestResult: raw.backtestResult ?? null,
    };
  }

  let predictionHistory = null;
  if (predictionsResult.status === 'fulfilled' && predictionsResult.value?.length) {
    predictionHistory = predictionsResult.value.map(
      ({ ticker, userPrediction, aiPrediction, actualOutcome, confidence, priceChangePct }) => ({
        ticker, userPrediction, aiPrediction, actualOutcome, confidence, priceChangePct,
      }),
    );
  }

  let newsSentiments = null;
  if (newsResult.status === 'fulfilled' && newsResult.value?.articles?.length) {
    newsSentiments = newsResult.value.articles.slice(0, 10).map(
      ({ title, source, sentiment, priceImpact, publishedAt }) => ({
        title, source, sentiment, priceImpact, publishedAt,
      }),
    );
  }

  // ── Proxy to ML advisor ───────────────────────────────────────────────────
  try {
    const mlResponse = await mlPost('/advisor/chat', {
      message: message.trim(),
      context: { portfolio, newsSentiments, predictionHistory },
    });
    return res.json({
      reply: mlResponse.reply,
      contextUsed: mlResponse.contextUsed,
    });
  } catch (err) {
    console.error('[advisor] ML service error:', err.message);
    // Graceful fallback — don't expose internal errors to the client
    return res.status(err.statusCode === 502 ? 502 : 500).json({
      message: err.message || 'Advisor service temporarily unavailable.',
    });
  }
});

// ── POST /api/advisor/chat/stream ─────────────────────────────────────────────
router.post('/chat/stream', protect, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'message is required and must be a non-empty string.' });
  }

  const userId = req.user._id;

  const [portfolioResult, predictionsResult, newsResult] = await Promise.allSettled([
    Portfolio.findOne({ userId }).lean(),
    Prediction.find({ userId }).sort({ timestamp: -1 }).limit(5).lean(),
    NewsCache.findOne().sort({ fetchedAt: -1 }).lean(),
  ]);

  let portfolio = null;
  if (portfolioResult.status === 'fulfilled' && portfolioResult.value) {
    const raw = portfolioResult.value;
    portfolio = {
      totalValue: raw.totalValue,
      totalCost: raw.totalCost,
      totalReturnPct: raw.totalReturnPct,
      sharpeRatio: raw.sharpeRatio,
      var95: raw.var95,
      beta: raw.beta,
      riskScore: raw.riskScore,
      aiNarrative: raw.aiNarrative,
      allocationInsights: raw.allocationInsights,
      recommendations: raw.recommendations,
      monteCarloPercentiles: raw.monteCarloPercentiles ?? null,
      backtestResult: raw.backtestResult ?? null,
      holdings: (raw.holdings || []).map(({ ticker, shares, avgBuyPrice, currentPrice, currentValue, weight }) => ({
        ticker, shares, avgBuyPrice, currentPrice, currentValue, weight,
      })),
    };
  }

  let predictionHistory = null;
  if (predictionsResult.status === 'fulfilled' && predictionsResult.value?.length) {
    predictionHistory = predictionsResult.value.map(
      ({ ticker, userPrediction, aiPrediction, actualOutcome, confidence, priceChangePct }) => ({
        ticker, userPrediction, aiPrediction, actualOutcome, confidence, priceChangePct,
      }),
    );
  }

  let newsSentiments = null;
  if (newsResult.status === 'fulfilled' && newsResult.value?.articles?.length) {
    newsSentiments = newsResult.value.articles.slice(0, 10).map(
      ({ title, source, sentiment, priceImpact, publishedAt }) => ({
        title, source, sentiment, priceImpact, publishedAt,
      }),
    );
  }

  // Set SSE headers before any write
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const mlRes = await fetch(`${ML_URL}/advisor/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        context: { portfolio, newsSentiments, predictionHistory },
      }),
    });

    if (!mlRes.ok) {
      const text = await mlRes.text();
      res.write(`data: ${JSON.stringify({ type: 'error', message: `ML error ${mlRes.status}: ${text.slice(0, 200)}` })}\n\n`);
      return res.end();
    }

    // Pipe the SSE body from ML service straight to the client
    const readable = Readable.fromWeb(mlRes.body);
    readable.on('data', (chunk) => res.write(chunk));
    readable.on('end', () => res.end());
    readable.on('error', (err) => {
      console.error('[advisor/stream] pipe error:', err.message);
      res.end();
    });
  } catch (err) {
    console.error('[advisor/stream] fetch error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Advisor stream unavailable.' })}\n\n`);
    res.end();
  }
});

export default router;
