import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis,
  CartesianGrid, Label,
} from 'recharts';
import api from '../utils/api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const sentimentBorder = (score) => {
  if (score > 0.05) return 'border-emerald-500';
  if (score < -0.05) return 'border-red-500';
  return 'border-yellow-500';
};

const sentimentDot = (score) => {
  if (score > 0.05) return '#10b981'; // emerald-500
  if (score < -0.05) return '#ef4444'; // red-500
  return '#eab308'; // yellow-500
};

const formatTime = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── Custom scatter dot colored by sentiment ───────────────────────────────────
const SentimentDot = (props) => {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={sentimentDot(payload.score)}
      fillOpacity={0.85}
      stroke="none"
    />
  );
};

// ── Custom timeline dot ───────────────────────────────────────────────────────
const TimelineDot = (props) => {
  const { cx, cy, payload } = props;
  return (
    <circle cx={cx} cy={cy} r={4} fill={sentimentDot(payload.score)} stroke="none" />
  );
};
// ── Custom scatter chart tooltip ──────────────────────────────────────────
const CustomScatterTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs space-y-1 shadow-lg">
      <p className="text-gray-300">
        <span className="text-gray-500">Score: </span>
        <span className={d.score > 0.05 ? 'text-emerald-400' : d.score < -0.05 ? 'text-red-400' : 'text-yellow-400'}>
          {d.score > 0 ? '+' : ''}{d.score.toFixed(3)}
        </span>
      </p>
      <p className="text-gray-300">
        <span className="text-gray-500">Price Impact: </span>
        <span className={d.priceImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {d.priceImpact >= 0 ? '+' : ''}{d.priceImpact.toFixed(2)}%
        </span>
      </p>
      {d.finbert_label && (
        <p className="text-gray-300">
          <span className="text-gray-500">FinBERT: </span>
          <span className={
            d.finbert_label === 'POSITIVE' ? 'text-emerald-300' :
              d.finbert_label === 'NEGATIVE' ? 'text-red-300' : 'text-yellow-300'
          }>{d.finbert_label}</span>
        </p>
      )}
      {d.marketImpactScore !== null && d.marketImpactScore !== undefined && (
        <p className="text-gray-300">
          <span className="text-gray-500">Market Impact: </span>
          <span className={d.marketImpactScore > 0 ? 'text-emerald-400' : d.marketImpactScore < 0 ? 'text-red-400' : 'text-yellow-400'}>
            {d.marketImpactScore > 0 ? '+' : ''}{d.marketImpactScore.toFixed(3)}
          </span>
        </p>
      )}
    </div>
  );
};
// ── Component ─────────────────────────────────────────────────────────────────

export default function NewsIntelligence() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('stock market finance');
  const [inputQuery, setInputQuery] = useState('stock market finance');

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/news/live', {
        params: { query: filterQuery },
      });
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilterQuery(inputQuery.trim() || 'stock market finance');
  };

  // Recharts data
  const timelineData = articles
    .filter((a) => a.publishedAt)
    .map((a) => ({ time: formatTime(a.publishedAt), score: a.score }));

  const scatterData = articles
    .filter((a) => a.priceImpact !== null && a.priceImpact !== undefined)
    .map((a) => ({
      score: a.score,
      priceImpact: a.priceImpact,
      finbert_label: a.finbert_label ?? '',
      marketImpactScore: a.marketImpactScore ?? null,
    }));

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a5068', marginBottom: 4 }}>News & Sentiment</p>
            <h1 className="text-2xl font-bold">
              News <span className="text-emerald-400">Intelligence</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Live headlines with VADER + FinBERT sentiment & price-impact correlation
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search topic…"
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                'Refresh'
              )}
            </button>
          </form>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ── Loading spinner ────────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-16">
            <span className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}

        {!loading && articles.length > 0 && (
          <>
            {/* ── Sentiment Heatmap Grid ───────────────────────────────── */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Sentiment Heatmap
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {articles.map((article, idx) => (
                  <a
                    key={idx}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-gray-900 border-l-4 ${sentimentBorder(article.score)} rounded-lg p-3 hover:bg-gray-800 transition-colors block`}
                  >
                    <p className="text-xs text-gray-400 mb-1">{article.source}</p>
                    <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">
                      {article.headline}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {article.relatedTicker && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-700 text-emerald-300 text-xs font-mono">
                          {article.relatedTicker}
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono ml-auto ${article.score > 0.05
                            ? 'text-emerald-400'
                            : article.score < -0.05
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                      >
                        {article.score > 0 ? '+' : ''}
                        {article.score.toFixed(2)}
                      </span>
                      {article.priceImpact !== null && article.priceImpact !== undefined && (
                        <span
                          className={`text-xs font-mono ${article.priceImpact >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                        >
                          {article.priceImpact >= 0 ? '▲' : '▼'}
                          {Math.abs(article.priceImpact).toFixed(2)}%
                        </span>
                      )}                      {article.finbert_label && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${article.finbert_label === 'POSITIVE'
                              ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
                              : article.finbert_label === 'NEGATIVE'
                                ? 'bg-red-900/60 text-red-300 border-red-700'
                                : 'bg-yellow-900/60 text-yellow-300 border-yellow-700'
                            }`}
                        >
                          {article.finbert_label}
                        </span>
                      )}
                      {article.marketImpactScore !== null && article.marketImpactScore !== undefined && (
                        <span
                          className={`text-xs font-mono ${article.marketImpactScore > 0
                              ? 'text-emerald-400'
                              : article.marketImpactScore < 0
                                ? 'text-red-400'
                                : 'text-yellow-400'
                            }`}
                        >
                          \u26a1 {article.marketImpactScore > 0 ? '+' : ''}{article.marketImpactScore.toFixed(3)}
                        </span>
                      )}                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* ── Charts row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Sentiment Timeline */}
              <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Sentiment Timeline
                </h2>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timelineData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[-1, 1]}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      tickCount={5}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#d1d5db' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={<TimelineDot />}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              {/* News-Price Correlation Scatter */}
              <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  News–Price Correlation
                </h2>
                {scatterData.length === 0 ? (
                  <p className="text-gray-500 text-sm flex items-center justify-center h-48">
                    No price-impact data available for current articles
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <ScatterChart margin={{ top: 4, right: 8, bottom: 20, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        type="number"
                        dataKey="score"
                        domain={[-1, 1]}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        name="Sentiment"
                      >
                        <Label value="Sentiment Score" offset={-10} position="insideBottom" fill="#6b7280" fontSize={11} />
                      </XAxis>
                      <YAxis
                        type="number"
                        dataKey="priceImpact"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        name="Price Impact %"
                      >
                        <Label value="Price Impact %" angle={-90} position="insideLeft" fill="#6b7280" fontSize={11} />
                      </YAxis>
                      <ZAxis range={[50, 50]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3', stroke: '#4b5563' }}
                        content={<CustomScatterTooltip />}
                      />
                      <ReferenceLine x={0} stroke="#6b7280" strokeDasharray="4 4" />
                      <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" />
                      <Scatter data={scatterData} shape={<SentimentDot />} />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </section>
            </div>
          </>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-16 text-gray-500">
            No articles found for &ldquo;{filterQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
