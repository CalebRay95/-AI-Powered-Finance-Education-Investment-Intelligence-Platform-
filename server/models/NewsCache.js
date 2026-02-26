import mongoose from 'mongoose';

/**
 * NewsCache — caches ML-service responses to respect NewsAPI rate limits.
 * Cache key is (query, tickers) so filtered and unfiltered results are stored separately.
 * Documents auto-expire after 15 minutes via a MongoDB TTL index on fetchedAt.
 */
const newsCacheSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true,
  },
  // Normalised comma-separated ticker string (or null for unfiltered requests)
  tickers: {
    type: String,
    default: null,
  },
  articles: {
    type: [Object],
    required: true,
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
    // TTL index — MongoDB removes documents 15 minutes after fetchedAt
    index: { expireAfterSeconds: 900 },
  },
});

// Compound index ensures (query + tickers) lookups are fast and unique
newsCacheSchema.index({ query: 1, tickers: 1 });

const NewsCache = mongoose.model('NewsCache', newsCacheSchema);

export default NewsCache;
