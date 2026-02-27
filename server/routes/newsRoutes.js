import express from 'express';
import protect from '../middleware/authMiddleware.js';
import NewsCache from '../models/NewsCache.js';

const router = express.Router();

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes (mirrors MongoDB TTL)

/** Normalise tickers to a sorted, uppercase, comma-joined string or null. */
const normaliseTickers = (raw) =>
  raw
    ? raw.split(',').map((t) => t.trim().toUpperCase()).sort().join(',')
    : null;

// GET /api/news/live

router.get('/live', protect, async (req, res) => {
  const { query = 'stock market finance', tickers } = req.query;
  const normTickers = normaliseTickers(tickers);
  const cacheKey = { query, tickers: normTickers };

  // 1. Check cache - key is (query, tickers)
  const cached = await NewsCache.findOne(cacheKey);
  if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
    return res.json({ articles: cached.articles, fromCache: true });
  }

  // 2. Build ML service URL
  const mlBase = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  const params = new URLSearchParams({ query });
  if (normTickers) params.set('tickers', normTickers);

  const mlUrl = `${mlBase}/news/live?${params.toString()}`;

  // 3. Fetch from ML service (Node 18+ built-in fetch)
  let mlResponse;
  try {
    mlResponse = await fetch(mlUrl, { signal: AbortSignal.timeout(45000) });
  } catch (err) {
    // ML is offline — serve stale cache rather than a hard error
    const stale = await NewsCache.findOne({ query });
    if (stale && stale.articles?.length) {
      return res.json({ articles: stale.articles, fromCache: true, stale: true });
    }
    return res.status(502).json({ message: `ML service unreachable: ${err.message}` });
  }

  if (!mlResponse.ok) {
    const text = await mlResponse.text();
    return res.status(502).json({
      message: `ML service returned ${mlResponse.status}: ${text.slice(0, 200)}`,
    });
  }

  const data = await mlResponse.json();
  const articles = data.articles ?? [];

  // 4. Upsert cache with (query, tickers) key
  await NewsCache.findOneAndUpdate(
    cacheKey,
    { articles, fetchedAt: new Date() },
    { upsert: true, new: true },
  );

  return res.json({ articles, fromCache: false });
});

export default router;
