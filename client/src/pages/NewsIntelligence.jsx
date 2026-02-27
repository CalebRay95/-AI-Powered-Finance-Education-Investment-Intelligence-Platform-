/**
 * NewsIntelligence.jsx â€” Flashcard-style news page.
 *
 * Layout:
 *   â€¢ Suggestion Pills          â€” clickable topic quick-picks
 *   â€¢ Breaking News Ticker      â€” scrolling strip for articles < 2 h old
 *   â€¢ Stats Row                 â€” total / positive / negative / avg sentiment
 *   â€¢ Tabs: All News | Stocks News | Charts
 *
 *   All News tab (2+1 col grid):
 *     â€“ Left: Flashcard feed bucketed by time
 *         (Latest Â· Yesterday Â· 2 Days Ago Â· This Week Â· This Month)
 *     â€“ Right sidebar:  Explore Topics Â· Sentiment Trend Â· Most Bullish Â· Most Bearish
 *
 *   Stocks News tab:  articles tagged with a ticker or containing stock keywords
 *   Charts tab:       Sentiment Timeline Â· Sentiment Distribution
 */

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import api from '../utils/api.js';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SUGGESTIONS = [
  '📈 Stock Market', 'NIFTY 50', 'Sensex', 'FII DII', 'RBI Policy',
  'AAPL', 'TSLA', 'NVDA', 'Gold & Silver', 'Crude Oil',
  'Fed Rate', 'Inflation', 'IPO 2025', 'Startup India', 'Crypto Bitcoin',
  'Rupee Dollar', 'IT Sector', 'Banking Stocks',
];

const STOCK_KW = ['stock', 'share', 'nse', 'bse', 'nasdaq', 'nyse', 'ipo',
  'earnings', 'quarter', 'market cap', 'dividend', 'sensex', 'nifty'];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const sentimentTheme = (score) => {
  if (score > 0.05) return {
    bar: 'bg-emerald-500', text: 'text-emerald-400',
    badge: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    glow: 'hover:shadow-emerald-900/30',
  };
  if (score < -0.05) return {
    bar: 'bg-red-500', text: 'text-red-400',
    badge: 'bg-red-900/40 text-red-400 border-red-800',
    glow: 'hover:shadow-red-900/30',
  };
  return {
    bar: 'bg-yellow-500', text: 'text-yellow-400',
    badge: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    glow: 'hover:shadow-yellow-900/20',
  };
};

const finbertTheme = (label) => {
  if (label === 'POSITIVE') return 'bg-emerald-900/40 text-emerald-400 border-emerald-800';
  if (label === 'NEGATIVE') return 'bg-red-900/40 text-red-400 border-red-800';
  return 'bg-yellow-900/40 text-yellow-400 border-yellow-800';
};

const relativeTime = (isoStr) => {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 31) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const bucketArticles = (articles) => {
  const now = Date.now();
  const b = { breaking: [], today: [], yesterday: [], twoDays: [], week: [], month: [] };
  articles.forEach((a) => {
    if (!a.publishedAt) { b.today.push(a); return; }
    const hrs = (now - new Date(a.publishedAt).getTime()) / 3_600_000;
    if (hrs < 2)        b.breaking.push(a);
    else if (hrs < 24)  b.today.push(a);
    else if (hrs < 48)  b.yesterday.push(a);
    else if (hrs < 72)  b.twoDays.push(a);
    else if (hrs < 168) b.week.push(a);
    else                b.month.push(a);
  });
  return b;
};

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Scrolling breaking-news strip */
function BreakingTicker({ articles }) {
  if (!articles.length) return null;
  return (
    <div className="flex items-center overflow-hidden bg-red-950/50 border border-red-800/70 rounded-xl py-2">
      <span className="shrink-0 bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-r-full
        mr-4 uppercase tracking-widest whitespace-nowrap">
        🔴 Breaking
      </span>
      <div className="overflow-hidden flex-1 min-w-0">
        <div className="flex gap-10 animate-marquee whitespace-nowrap">
          {[...articles, ...articles].map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
              className="text-red-200 text-sm hover:text-white transition-colors shrink-0 max-w-sm truncate">
              {a.relatedTicker && (
                <span className="text-red-400 font-mono font-bold mr-1.5">[{a.relatedTicker}]</span>
              )}
              {a.headline}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Slim flashcard with coloured left bar */
function NewsFlashcard({ article }) {
  const c = sentimentTheme(article.score ?? 0);
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-stretch rounded-xl overflow-hidden border border-gray-800/80
        hover:border-gray-600 bg-gray-900/50 hover:bg-gray-900
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${c.glow}`}
    >
      <div className={`w-[3px] shrink-0 ${c.bar}`} />
      <div className="flex flex-col gap-1 px-3 py-2.5 flex-1 min-w-0">
        {/* Meta */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-500 text-xs truncate max-w-[120px]">{article.source || 'News'}</span>
          <span className="text-gray-700 text-xs">·</span>
          <span className="text-gray-600 text-xs">{relativeTime(article.publishedAt)}</span>
          {article.relatedTicker && (
            <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded bg-gray-800
              text-emerald-300 text-xs font-mono border border-gray-700 leading-none">
              {article.relatedTicker}
            </span>
          )}
        </div>
        {/* Headline */}
        <p className="text-sm font-medium text-gray-200 leading-snug
          group-hover:text-white transition-colors line-clamp-2">
          {article.headline}
        </p>
        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className={`text-xs font-mono font-semibold tabular-nums ${c.text}`}>
            {(article.score ?? 0) > 0 ? '+' : ''}{(article.score ?? 0).toFixed(3)}
          </span>
          {article.finbert_label && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full border leading-none ${finbertTheme(article.finbert_label)}`}>
              {article.finbert_label}
            </span>
          )}
          {article.priceImpact != null && (
            <span className={`text-xs font-mono tabular-nums ${article.priceImpact >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {article.priceImpact >= 0 ? 'â–²' : 'â–¼'}{Math.abs(article.priceImpact).toFixed(2)}%
            </span>
          )}
          {article.marketImpactScore != null && (
            <span className={`text-xs font-mono tabular-nums ${article.marketImpactScore > 0 ? 'text-emerald-400' : article.marketImpactScore < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
              âš¡{article.marketImpactScore > 0 ? '+' : ''}{article.marketImpactScore.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

/** Collapsible time-bucket heading */
function TimeSection({ label, icon, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!count) return null;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 py-2 group text-left"
      >
        <span>{icon}</span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400
          group-hover:text-gray-200 transition-colors">
          {label}
        </span>
        <span className="text-xs text-gray-600 bg-gray-800/80 px-2 py-0.5 rounded-full font-mono">
          {count}
        </span>
        <div className="flex-1 h-px bg-gray-800 ml-1" />
        <span className="text-gray-700 text-xs">{open ? 'â–²' : 'â–¼'}</span>
      </button>
      {open && <div className="space-y-1.5 mt-1 ml-1">{children}</div>}
    </div>
  );
}

/** 4-stat summary row */
function StatsRow({ articles }) {
  const pos = articles.filter((a) => (a.score ?? 0) > 0.05).length;
  const neg = articles.filter((a) => (a.score ?? 0) < -0.05).length;
  const avg = articles.length
    ? articles.reduce((s, a) => s + (a.score ?? 0), 0) / articles.length : 0;
  const avgLabel = avg > 0.05 ? 'Bullish' : avg < -0.05 ? 'Bearish' : 'Neutral';
  const cards = [
    { label: 'Total Articles', value: articles.length, sub: 'fetched now', color: 'text-blue-400' },
    { label: 'Positive', value: pos, sub: `${articles.length ? ((pos / articles.length) * 100).toFixed(0) : 0}% of total`, color: 'text-emerald-400' },
    { label: 'Negative', value: neg, sub: `${articles.length ? ((neg / articles.length) * 100).toFixed(0) : 0}% of total`, color: 'text-red-400' },
    { label: 'Avg Sentiment', value: avg > 0 ? `+${avg.toFixed(3)}` : avg.toFixed(3), sub: avgLabel, color: avg > 0.05 ? 'text-emerald-400' : avg < -0.05 ? 'text-red-400' : 'text-yellow-400' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-gray-900/70 border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{c.label}</p>
          <p className={`text-xl font-bold font-mono tabular-nums ${c.color}`}>{c.value}</p>
          <p className="text-xs text-gray-600 mt-0.5">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

/** Right sidebar */
function Sidebar({ articles, timelineData, onSuggest, filterQuery }) {
  return (
    <div className="space-y-4">
      {/* Explore Topics */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">
          💡 Explore Topics
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => {
            const clean = s.replace(/^[^\w]+/, '').trim();
            return (
              <button key={s} onClick={() => onSuggest(clean)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                  filterQuery === clean
                    ? 'bg-emerald-700 border-emerald-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-emerald-700 hover:text-emerald-400'
                }`}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sentiment Trend mini chart */}
      {timelineData.length > 2 && (
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">
            📈 Sentiment Trend
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={timelineData} margin={{ top: 2, right: 8, bottom: 2, left: -22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" tick={{ fill: '#374151', fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis domain={[-1, 1]} tick={{ fill: '#374151', fontSize: 9 }} tickCount={3} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: 8, fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#1f2937" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Most Bullish */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 mb-3">
          🟢 Most Bullish
        </h3>
        <div className="space-y-2">
          {[...articles].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 4).map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
              className="block text-xs text-gray-400 hover:text-white leading-snug
                line-clamp-2 py-1.5 border-b border-gray-800/70 last:border-0 transition-colors">
              <span className="text-emerald-500 font-mono font-semibold mr-1">
                +{(a.score ?? 0).toFixed(2)}
              </span>
              {a.headline}
            </a>
          ))}
        </div>
      </div>

      {/* Most Bearish */}
      <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-800 mb-3">
          🔴 Most Bearish
        </h3>
        <div className="space-y-2">
          {[...articles].sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 4).map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
              className="block text-xs text-gray-400 hover:text-white leading-snug
                line-clamp-2 py-1.5 border-b border-gray-800/70 last:border-0 transition-colors">
              <span className="text-red-500 font-mono font-semibold mr-1">
                {(a.score ?? 0).toFixed(2)}
              </span>
              {a.headline}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function NewsIntelligence() {
  const [articles, setArticles]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [staleCache, setStaleCache]       = useState(false);
  const [filterQuery, setFilterQuery]     = useState('stock market finance');
  const [inputQuery, setInputQuery]       = useState('stock market finance');
  const [activeTab, setActiveTab]         = useState('all');

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError('');
    setStaleCache(false);
    try {
      const { data } = await api.get('/api/news/live', { params: { query: filterQuery } });
      setArticles(data.articles || []);
      if (data.stale) setStaleCache(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch news. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filterQuery]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilterQuery(inputQuery.trim() || 'stock market finance');
  };

  const handleSuggest = (s) => {
    const clean = s.replace(/^[^\w]+/, '').trim();
    setInputQuery(clean);
    setFilterQuery(clean);
  };

  /* Derived */
  const buckets       = bucketArticles(articles);
  const stockArticles = articles.filter(
    (a) => a.relatedTicker || STOCK_KW.some((k) => (a.headline || '').toLowerCase().includes(k)),
  );
  const timelineData = articles
    .filter((a) => a.publishedAt)
    .map((a) => ({ time: relativeTime(a.publishedAt), score: a.score ?? 0 }));

  const TABS = [
    { id: 'all',    label: 'All News',    count: articles.length },
    { id: 'stocks', label: 'Stocks News', count: stockArticles.length },
    { id: 'charts', label: 'Charts',      count: null },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold tracking-[.14em] uppercase text-gray-600 mb-1">
              News & Sentiment Intelligence
            </p>
            <h1 className="text-2xl font-bold">
              News <span className="text-emerald-400">Intelligence</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Live headlines · VADER + FinBERT sentiment · price-impact correlation
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search topicâ€¦"
              className="bg-gray-900 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm
                placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white
                font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : '🔄 Refresh'}
            </button>
          </form>
        </div>

        {/* â”€â”€ Suggestion Pills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => {
            const clean = s.replace(/^[^\w]+/, '').trim();
            return (
              <button key={s} onClick={() => handleSuggest(clean)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filterQuery === clean
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-emerald-700 hover:text-emerald-400'
                }`}>
                {s}
              </button>
            );
          })}
        </div>

        {/* â”€â”€ Error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {staleCache && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-yellow-900/20 border border-yellow-800/60 text-yellow-400 text-xs">
            <span className="text-base">⚡</span>
            <span>Showing <strong>cached news</strong> — ML service offline. Run <code className="text-yellow-300">uv run uvicorn main:app --reload</code> in ml-service/.</span>
            <button onClick={fetchNews} className="ml-auto shrink-0 px-2.5 py-1 rounded-lg border border-yellow-700 hover:bg-yellow-900/40 transition-colors">⟳ Retry</button>
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-800">
            <div className="flex items-start gap-3">
              <span className="text-red-400 mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="text-red-300 text-sm font-medium">{error}</p>
                <p className="text-red-500 text-xs mt-1">Start ML service: <code className="text-red-400">cd ml-service &amp;&amp; uv run uvicorn main:app --reload</code></p>
              </div>
              <button onClick={fetchNews} className="shrink-0 text-xs text-red-400 hover:text-red-200 border border-red-800 px-2.5 py-1 rounded-lg">⟳ Retry</button>
            </div>
          </div>
        )}

        {/* â”€â”€ Loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {loading && (
          <div className="flex justify-center py-20">
            <span className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}

        {/* â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!loading && articles.length > 0 && (
          <>
            {/* Breaking Ticker */}
            {buckets.breaking.length > 0 && <BreakingTicker articles={buckets.breaking} />}

            {/* Stats */}
            <StatsRow articles={articles} />

            {/* Tabs */}
            <div className="flex items-center border-b border-gray-800">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}>
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* â”€â”€ All News â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeTab === 'all' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-1">
                  <TimeSection label="Latest · Today" icon="🔥"
                    count={buckets.breaking.length + buckets.today.length} defaultOpen>
                    {[...buckets.breaking, ...buckets.today].map((a, i) => <NewsFlashcard key={i} article={a} />)}
                  </TimeSection>
                  <TimeSection label="Yesterday" icon="📅" count={buckets.yesterday.length} defaultOpen>
                    {buckets.yesterday.map((a, i) => <NewsFlashcard key={i} article={a} />)}
                  </TimeSection>
                  <TimeSection label="2 Days Ago" icon="🗓️" count={buckets.twoDays.length} defaultOpen={false}>
                    {buckets.twoDays.map((a, i) => <NewsFlashcard key={i} article={a} />)}
                  </TimeSection>
                  <TimeSection label="This Week" icon="📆" count={buckets.week.length} defaultOpen={false}>
                    {buckets.week.map((a, i) => <NewsFlashcard key={i} article={a} />)}
                  </TimeSection>
                  <TimeSection label="This Month" icon="📰" count={buckets.month.length} defaultOpen={false}>
                    {buckets.month.map((a, i) => <NewsFlashcard key={i} article={a} />)}
                  </TimeSection>
                </div>
                <div className="lg:col-span-1">
                  <Sidebar articles={articles} timelineData={timelineData}
                    onSuggest={handleSuggest} filterQuery={filterQuery} />
                </div>
              </div>
            )}

            {/* â”€â”€ Stocks News â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeTab === 'stocks' && (
              <div className="space-y-4">
                {/* Ticker chips */}
                {(() => {
                  const tickers = [...new Set(stockArticles.map((a) => a.relatedTicker).filter(Boolean))];
                  return tickers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tickers.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold
                          border border-emerald-800 bg-emerald-900/30 text-emerald-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}

                <p className="text-xs text-gray-600">
                  {stockArticles.length} articles tagged with tickers or matching stock keywords
                </p>

                {stockArticles.length === 0 ? (
                  <div className="text-center py-16 text-gray-600">
                    No stock-specific articles found for &ldquo;{filterQuery}&rdquo;
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {stockArticles.map((a, i) => <NewsFlashcard key={i} article={a} />)}
                  </div>
                )}

                {/* Quick-search suggestion box */}
                <div className="mt-4 bg-gray-900/70 border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-3">
                    🔍 Try searching for a stock
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['AAPL', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'META', 'MSFT',
                      'RELIANCE', 'INFY', 'TCS', 'HDFC', 'ICICI', 'LT'].map((t) => (
                      <button key={t} onClick={() => handleSuggest(t)}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold
                          border border-gray-700 bg-gray-800 text-gray-300
                          hover:border-emerald-700 hover:text-emerald-400 transition-all">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ Charts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sentiment Timeline */}
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-5">
                    Sentiment Timeline
                  </h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={timelineData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="time" tick={{ fill: '#4b5563', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis domain={[-1, 1]} tick={{ fill: '#4b5563', fontSize: 10 }} tickCount={5} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1f2937', borderRadius: 8 }}
                        labelStyle={{ color: '#9ca3af' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2}
                        dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Sentiment Distribution */}
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-5">
                    Sentiment Distribution
                  </h2>
                  <div className="space-y-3 mt-4">
                    {[
                      { label: 'Strongly Positive  > +0.30', filter: (s) => s > 0.30, color: 'bg-emerald-400' },
                      { label: 'Positive  +0.05 â†’ +0.30', filter: (s) => s > 0.05 && s <= 0.30, color: 'bg-emerald-600' },
                      { label: 'Neutral   âˆ’0.05 â†’ +0.05', filter: (s) => s >= -0.05 && s <= 0.05, color: 'bg-yellow-500' },
                      { label: 'Negative  âˆ’0.30 â†’ âˆ’0.05', filter: (s) => s < -0.05 && s >= -0.30, color: 'bg-red-600' },
                      { label: 'Strongly Negative  < âˆ’0.30', filter: (s) => s < -0.30, color: 'bg-red-400' },
                    ].map((b) => {
                      const cnt = articles.filter((a) => b.filter(a.score ?? 0)).length;
                      const pct = articles.length ? (cnt / articles.length) * 100 : 0;
                      return (
                        <div key={b.label}>
                          <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
                            <span className="text-gray-400">{b.label}</span>
                            <span>{cnt} <span className="text-gray-700">({pct.toFixed(0)}%)</span></span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${b.color} rounded-full transition-all duration-700`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary counts */}
                <div className="lg:col-span-2 bg-gray-900/70 border border-gray-800 rounded-2xl p-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-4">
                    📌 Bucket Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Total',     value: articles.length,          color: 'text-blue-400' },
                      { label: 'Breaking',  value: buckets.breaking.length,  color: 'text-red-400' },
                      { label: 'Today',     value: buckets.today.length,     color: 'text-orange-400' },
                      { label: 'Yesterday', value: buckets.yesterday.length, color: 'text-yellow-400' },
                      { label: 'This Week', value: buckets.week.length,      color: 'text-purple-400' },
                      { label: 'Stocks',    value: stockArticles.length,     color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.label} className="text-center bg-gray-800/50 rounded-xl py-3 px-2">
                        <p className={`text-2xl font-bold font-mono tabular-nums ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-600 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-20 text-gray-600">
            No articles found for &ldquo;{filterQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
