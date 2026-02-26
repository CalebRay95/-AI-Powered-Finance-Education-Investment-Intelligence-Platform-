/**
 * Portfolio Analyzer — Nexus Dark Theme (v2)
 *
 * Changes from v1:
 *  - No emoji stickers anywhere; bold uppercase labels instead
 *  - Buttons moved to header, pill-style, no emoji
 *  - New AI Insights panel design (narrative / allocation / recommendations)
 *  - All numeric values guarded for null safety
 *  - CSV-trained model drives chart data (via backend /prediction/chart/)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#14b8a6', '#3b82f6', '#a855f7', '#f59e0b', '#f97316', '#ef4444', '#10b981', '#8b5cf6'];
const BLANK_ROW = () => ({ ticker: '', shares: '', avgBuyPrice: '' });

// ─── Safe number formatters ────────────────────────────────────────────────────
const safeFixed = (v, d = 2) => (v == null || isNaN(v) ? 'N/A' : Number(v).toFixed(d));
const safeNumFmt = (v, d = 2) => (v == null || isNaN(v) ? 'N/A' : Number(v).toFixed(d));
const varPct = (v) => (v == null || isNaN(v) ? 'N/A' : `${(Number(v) * 100).toFixed(3)}%`);

function metricColor(type, value) {
  if (value == null || isNaN(value)) return 'text-gray-400';
  if (type === 'return') return value >= 0 ? 'text-[#14b8a6]' : 'text-red-400';
  if (type === 'sharpe') return value > 1 ? 'text-[#14b8a6]' : value >= 0 ? 'text-yellow-400' : 'text-red-400';
  if (type === 'var') return 'text-red-400';
  if (type === 'beta') return value > 1.2 ? 'text-yellow-400' : 'text-[#14b8a6]';
  return 'text-gray-300';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5 relative overflow-hidden">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// Labels are handled by <Legend> — no custom renderLabel needed

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PortfolioAnalyzer() {
  const { user } = useAuth();

  const [rows, setRows] = useState([BLANK_ROW()]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Load saved portfolio on mount
  const loadPortfolio = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await api.get(`/api/portfolio/${user.id}`);
      if (data?.holdings?.length) {
        setRows(
          data.holdings.map((h) => ({
            ticker: h.ticker,
            shares: String(h.shares),
            avgBuyPrice: String(h.avgBuyPrice),
          })),
        );
        if (data.totalReturnPct != null) setAnalysis(data);
      }
    } catch (_) { /* 404 = first visit */ }
  }, [user?.id]);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  // Row management
  function updateRow(idx, field, value) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === 'ticker' ? value.toUpperCase() : value };
      return next;
    });
  }
  const addRow = () => setRows((p) => [...p, BLANK_ROW()]);
  const removeRow = (idx) => setRows((p) => p.filter((_, i) => i !== idx));

  function buildHoldings() {
    return rows
      .filter((r) => r.ticker.trim())
      .map((r) => ({
        ticker: r.ticker.trim().toUpperCase(),
        shares: parseFloat(r.shares) || 0,
        avgBuyPrice: parseFloat(r.avgBuyPrice) || 0,
      }));
  }

  // Save
  async function handleSave() {
    const holdings = buildHoldings();
    if (!holdings.length) return setError('Add at least one holding before saving.');
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.post('/api/portfolio/holdings', { holdings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed.');
    } finally { setSaving(false); }
  }

  // Analyze
  async function handleAnalyze() {
    const holdings = buildHoldings();
    if (!holdings.length) return setError('Add at least one holding before analyzing.');
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/api/portfolio/analyze', { holdings });
      setAnalysis(data);
      setActiveTab('overview');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Analysis failed.');
    } finally { setLoading(false); }
  }

  // Derived chart data
  const pieData = analysis?.holdings?.map((h) => ({
    name: h.ticker,
    value: parseFloat((h.weight ?? 0).toFixed(2)),
  })) ?? [];

  const barData = analysis?.holdings?.map((h) => ({
    ticker: h.ticker,
    risk: parseFloat(((h.weight / 100) * Math.abs(analysis.var95 ?? 0) * 100).toFixed(4)),
  })) ?? [];

  const perfData = analysis?.performanceSeries ?? [];
  const holdingRows = analysis?.holdings ?? [];

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b101e] text-white px-8 py-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <header className="flex justify-between items-end mb-8 relative">
        <div>
          <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-1">Analytics Engine</p>
          <h1 className="text-4xl font-serif tracking-tight">
            Portfolio <span className="text-[#14b8a6] italic">Analyzer</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]/60 shrink-0" />
            CSV-trained model · AI-powered risk metrics and allocation intelligence
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-full border border-[#1f2937] text-gray-400 text-xs font-bold tracking-wider uppercase hover:text-white hover:border-gray-500 disabled:opacity-40 transition-colors"
          >
            {saving ? 'SAVING...' : saved ? 'SAVED' : 'SAVE HOLDINGS'}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-5 py-2 rounded-full border border-[#14b8a6]/40 bg-[#14b8a6]/10 text-[#14b8a6] text-xs font-bold tracking-wider uppercase hover:bg-[#14b8a6]/20 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <><span className="w-3 h-3 border border-[#14b8a6]/30 border-t-[#14b8a6] rounded-full animate-spin" />ANALYZING</>
            ) : 'ANALYZE PORTFOLIO'}
          </button>
        </div>
        <div className="absolute top-4 left-40 w-32 h-16 bg-[#14b8a6]/10 blur-[40px] rounded-full pointer-events-none" />
      </header>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800/50 text-red-300 rounded-xl px-5 py-3 text-sm">
          <span className="font-bold">ERROR</span> — {error}
        </div>
      )}

      {/* Holdings Input */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Your Holdings</p>
          <p className="text-[9px] text-gray-500 uppercase tracking-wider">{rows.filter(r => r.ticker).length} positions</p>
        </div>

        <div className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-3 mb-2 text-[9px] text-gray-600 uppercase tracking-wider px-1">
          <span>Ticker Symbol</span><span>Shares</span><span>Avg Buy Price</span><span />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[2fr_1fr_1.5fr_auto] gap-3">
              <input
                className="bg-[#0b101e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#14b8a6]/50 uppercase font-mono tracking-widest transition-colors"
                placeholder="AAPL / RELIANCE"
                value={row.ticker}
                onChange={(e) => updateRow(idx, 'ticker', e.target.value)}
              />
              <input
                type="number" min="0"
                className="bg-[#0b101e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#14b8a6]/50 transition-colors"
                placeholder="100"
                value={row.shares}
                onChange={(e) => updateRow(idx, 'shares', e.target.value)}
              />
              <input
                type="number" min="0"
                className="bg-[#0b101e] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#14b8a6]/50 transition-colors"
                placeholder="150.00"
                value={row.avgBuyPrice}
                onChange={(e) => updateRow(idx, 'avgBuyPrice', e.target.value)}
              />
              <button
                onClick={() => removeRow(idx)}
                disabled={rows.length === 1}
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-sm font-mono"
              >x</button>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-4 px-4 py-2 text-[10px] uppercase tracking-widest font-bold border border-dashed border-[#1f2937] hover:border-[#14b8a6]/40 rounded-lg text-gray-600 hover:text-[#14b8a6] transition-colors w-full"
        >
          + Add another holding
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-12 mb-6 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-2 border-[#1f2937] border-t-[#14b8a6] rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-white">Running Analysis Pipeline</p>
            <p className="text-xs text-gray-500 mt-1">Fetching CSV price data · Computing risk metrics · Generating AI insights</p>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Return"
              value={analysis.totalReturnPct != null ? `${analysis.totalReturnPct >= 0 ? '+' : ''}${safeFixed(analysis.totalReturnPct)}%` : 'N/A'}
              color={metricColor('return', analysis.totalReturnPct)}
              sub={`Portfolio value: ${analysis.totalValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}`}
            />
            <StatCard
              label="Sharpe Ratio"
              value={safeNumFmt(analysis.sharpeRatio)}
              color={metricColor('sharpe', analysis.sharpeRatio)}
              sub="Annualised risk-adjusted"
            />
            <StatCard
              label="VaR (95%)"
              value={varPct(analysis.var95)}
              color={metricColor('var', analysis.var95)}
              sub="Max daily loss threshold"
            />
            <StatCard
              label="Beta"
              value={safeNumFmt(analysis.beta)}
              color={metricColor('beta', analysis.beta)}
              sub="Market sensitivity"
            />
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 mb-6 bg-[#111827] border border-[#1f2937] rounded-xl p-1 w-fit">
            {[
              { id: 'overview', label: 'OVERVIEW' },
              { id: 'risk', label: 'RISK ANALYSIS' },
              { id: 'ai', label: 'AI INSIGHTS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 text-[10px] font-bold tracking-widest uppercase rounded-lg transition-all ${activeTab === tab.id
                    ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Holdings table */}
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1f2937]">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Holdings Summary</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1f2937]">
                        {['Stock', 'Shares', 'Buy Price', 'Current', 'P&L', 'Weight', 'Return'].map((h) => (
                          <th key={h} className="text-left text-[9px] text-gray-500 uppercase tracking-wider px-5 py-3 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f2937]">
                      {holdingRows.map((h, i) => {
                        const ret = h.avgBuyPrice ? ((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice * 100) : 0;
                        const pnl = (h.currentPrice - h.avgBuyPrice) * h.shares;
                        return (
                          <tr key={i} className="hover:bg-[#1a2332] transition-colors group">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded bg-[#1a2332] flex items-center justify-center text-[10px] font-bold text-[#14b8a6] border border-[#14b8a6]/20 group-hover:border-[#14b8a6]/40 transition-colors">
                                  {h.ticker?.substring(0, 2)}
                                </div>
                                <span className="font-mono font-bold text-gray-200 text-xs tracking-widest">{h.ticker}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 font-mono text-gray-300 text-xs">{h.shares}</td>
                            <td className="px-5 py-3 font-mono text-gray-500 text-xs">{safeFixed(h.avgBuyPrice)}</td>
                            <td className="px-5 py-3 font-mono text-white font-bold text-xs">{safeFixed(h.currentPrice)}</td>
                            <td className={`px-5 py-3 font-mono font-bold text-xs ${pnl >= 0 ? 'text-[#14b8a6]' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}{safeFixed(pnl, 0)}
                            </td>
                            <td className="px-5 py-3 font-mono text-gray-400 text-xs">{safeFixed(h.weight, 1)}%</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider ${ret >= 0
                                  ? 'text-[#14b8a6] border-[#14b8a6]/20 bg-[#14b8a6]/5'
                                  : 'text-red-400 border-red-500/20 bg-red-500/5'
                                }`}>
                                {ret >= 0 ? '+' : ''}{safeFixed(ret)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pie + Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Allocation Pie */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-6">Portfolio Allocation</p>
                  {pieData.length > 0 ? (
                    <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" outerRadius={95} innerRadius={42}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 11 }}
                          formatter={(v) => [`${v}%`, 'Weight']}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, color: '#6b7280' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-xs text-gray-600 uppercase tracking-widest">No allocation data</p>
                    </div>
                  )}
                </div>

                {/* 30-Day Performance */}
                <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-6">30-Day Portfolio Value (CSV Data)</p>
                  {perfData.length > 0 ? (
                    <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={perfData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 9 }} tickFormatter={(d) => d.slice(5)} />
                        <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} width={70}
                          tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toFixed(0)} />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 11 }}
                          formatter={(v) => [Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }), 'Value']}
                          labelStyle={{ color: '#6b7280', fontSize: 9 }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} fill="url(#portGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center gap-2">
                      <p className="text-xs text-gray-600 uppercase tracking-widest">No performance data</p>
                      <p className="text-[10px] text-gray-700">FAANG tickers use CSV data · Other tickers require yfinance</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── RISK TAB ── */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-red-500/20 rounded-xl p-5">
                  <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold mb-3">VaR Interpretation</p>
                  <p className="text-2xl font-bold font-mono text-red-400">{varPct(analysis.var95)}</p>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    On any given day, there is a 95% chance the portfolio will not lose more than this percentage of its value.
                  </p>
                </div>
                <div className="bg-[#111827] border border-[#14b8a6]/20 rounded-xl p-5">
                  <p className="text-[9px] text-[#14b8a6] uppercase tracking-widest font-bold mb-3">Beta Analysis</p>
                  <p className="text-2xl font-bold font-mono text-[#14b8a6]">{safeNumFmt(analysis.beta)}</p>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {(analysis.beta ?? 1) > 1
                      ? 'Portfolio is more volatile than the market index. Higher risk, potentially higher reward.'
                      : 'Portfolio is less volatile than the market. More defensive allocation.'}
                  </p>
                </div>
                <div className="bg-[#111827] border border-yellow-500/20 rounded-xl p-5">
                  <p className="text-[9px] text-yellow-400 uppercase tracking-widest font-bold mb-3">Sharpe Ratio</p>
                  <p className="text-2xl font-bold font-mono text-yellow-400">{safeNumFmt(analysis.sharpeRatio)}</p>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {(analysis.sharpeRatio ?? 0) > 1
                      ? 'Excellent risk-adjusted returns. Portfolio is well-optimised.'
                      : (analysis.sharpeRatio ?? 0) > 0
                        ? 'Moderate returns relative to risk taken. Consider diversifying.'
                        : 'Poor risk-adjusted returns. Review portfolio composition.'}
                  </p>
                </div>
              </div>

              {/* Risk Contribution Bar */}
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-6">Risk Contribution by Position (VaR proxy)</p>
                <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="ticker" tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8, fontSize: 11 }}
                      formatter={(v) => [`${v}%`, 'Risk Contribution']}
                    />
                    <Bar dataKey="risk" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── AI INSIGHTS TAB ── */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* Header bar */}
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">AI Portfolio Intelligence</p>
                  <p className="text-xs text-gray-600 mt-0.5">Powered by Gemini · Based on your current holdings and risk metrics</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#14b8a6] border border-[#14b8a6]/30 px-3 py-1 rounded-full">
                  LIVE ANALYSIS
                </span>
              </div>

              {analysis.aiNarrative ? (
                <>
                  {/* Narrative */}
                  <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                    <p className="text-[9px] text-[#14b8a6] uppercase tracking-widest font-bold mb-4">Portfolio Health Summary</p>
                    <div className="border-l-2 border-[#14b8a6] pl-5">
                      <p className="text-sm text-gray-300 leading-relaxed">{analysis.aiNarrative}</p>
                    </div>
                  </div>

                  {/* Allocation Insights */}
                  {analysis.allocationInsights && (
                    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                      <p className="text-[9px] text-yellow-400 uppercase tracking-widest font-bold mb-4">Allocation Insights</p>
                      <div className="bg-[#0b101e] rounded-lg p-4 border border-[#1f2937]">
                        <p className="text-sm text-gray-300 leading-relaxed">{analysis.allocationInsights}</p>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations && (
                    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
                      <p className="text-[9px] text-[#14b8a6] uppercase tracking-widest font-bold mb-4">Actionable Recommendations</p>
                      <div className="space-y-3">
                        {analysis.recommendations.split(/\d+\./).filter(Boolean).map((rec, i) => (
                          <div key={i} className="flex items-start gap-4 bg-[#0b101e] rounded-lg p-4 border border-[#1f2937]">
                            <span className="w-6 h-6 rounded bg-[#14b8a6]/10 border border-[#14b8a6]/20 flex items-center justify-center text-[10px] font-bold text-[#14b8a6] shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-gray-300 leading-relaxed">{rec.trim()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full border border-[#1f2937] flex items-center justify-center mb-6">
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">AI</span>
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">No AI Insights Yet</p>
                  <p className="text-xs text-gray-600 max-w-sm leading-relaxed">
                    Click <strong className="text-[#14b8a6]">ANALYZE PORTFOLIO</strong> to generate AI-powered recommendations from Gemini.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full border border-[#1f2937] flex items-center justify-center mb-6 bg-[#14b8a6]/5">
            <span className="text-[10px] font-bold text-[#14b8a6] uppercase tracking-widest">GIFT</span>
          </div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-gray-300 mb-2">Ready for Analysis</h2>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-10">
            Enter your holdings above and click <strong className="text-[#14b8a6]">ANALYZE PORTFOLIO</strong> to get real-time risk metrics, CSV-trained predictions, and AI-powered recommendations.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center w-full max-w-lg">
            {[
              { label: 'Return Analysis', sub: 'P&L per position' },
              { label: 'Risk Metrics', sub: 'VaR · Sharpe · Beta' },
              { label: 'AI Insights', sub: 'Gemini-powered' },
            ].map((f) => (
              <div key={f.label} className="bg-[#0b101e] border border-[#1f2937] rounded-xl p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{f.label}</p>
                <p className="text-[9px] text-gray-700 mt-1">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
