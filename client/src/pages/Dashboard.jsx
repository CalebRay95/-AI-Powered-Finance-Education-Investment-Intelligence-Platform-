import { useAuth } from '../context/AuthContext.jsx';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.js';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

// ─── Formatting Helpers ────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const kLakhs = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n.toFixed(0)}`;
};

// ─── Placeholder Data for missing Indian context ───────────────────────────────
const perfData = [
  { time: '09:15', val: 720000 }, { time: '10:00', val: 715000 },
  { time: '11:00', val: 725000 }, { time: '12:00', val: 740000 },
  { time: '13:00', val: 735000 }, { time: '14:00', val: 730000 },
  { time: '15:00', val: 735000 }, { time: '15:30', val: 728000 }
];

const topHoldings = [
  { ticker: 'MARUTI', shares: 200, pct: '+9.7%' },
  { ticker: 'ITC', shares: 1545, pct: '+14.4%' },
  { ticker: 'RELIANCE', shares: 700, pct: '+11.2%' },
  { ticker: 'HDFCBANK', shares: 2030, pct: '+8.5%' },
  { ticker: 'INFY', shares: 707, pct: '+10.6%' },
  { ticker: 'TCS', shares: 207, pct: '+12.4%' },
];

const sectorBreakdown = [
  { name: 'IT Services', val: '+18.6k', pct: '33.5%', width: 'w-10/12' },
  { name: 'Conglomerate', val: '+9.8k', pct: '11.1%', width: 'w-4/12' },
  { name: 'Banking', val: '+15.2k', pct: '22.6%', width: 'w-8/12' },
  { name: 'Pharma', val: '+5.5k', pct: '7.2%', width: 'w-2/12' },
  { name: 'Auto', val: '+8.2k', pct: '10.8%', width: 'w-3/12' },
  { name: 'FMCG', val: '+11.5k', pct: '14.8%', width: 'w-5/12' },
];

const marketMovers = [
  { t: 'TCS', c: '+1.27%', color: 'border-emerald-500/30 text-emerald-400' },
  { t: 'INFY', c: '+1.04%', color: 'border-emerald-500/30 text-emerald-400' },
  { t: 'WIPRO', c: '-0.83%', color: 'border-red-500/30 text-red-400' },
  { t: 'HCLTECH', c: '+1.18%', color: 'border-emerald-500/30 text-emerald-400' },
  { t: 'TECHM', c: '-0.45%', color: 'border-red-500/30 text-red-400' },
  { t: 'HDFCBANK', c: '+0.85%', color: 'border-emerald-500/30 text-emerald-400' },
  { t: 'ICICIBANK', c: '+1.78%', color: 'border-emerald-500/30 text-emerald-400' },
  { t: 'SBIN', c: '-0.16%', color: 'border-red-500/30 text-red-400' },
  { t: 'BAJFINANCE', c: '-1.25%', color: 'border-red-500/30 text-red-400' },
  { t: 'KOTAKBANK', c: '-0.01%', color: 'border-red-500/30 text-red-400' },
  { t: 'RELIANCE', c: '+1.26%', color: 'border-emerald-500/30 text-emerald-400' },
  { t: 'ONGC', c: '-1.12%', color: 'border-red-500/30 text-red-400' },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    portfolioValue: '₹0.00',
    unrealisedPl: '₹0.00',
    positions: 0,
    bestPerformer: 'N/A'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      try {
        const portRes = await api.get(`/api/portfolio/${user.id}`);
        // Extract real data if present
        let pv = 735000; // Mock fallback aligning with image
        let pnl = 80800; // Mock fallback
        let pos = 10;
        let best = '+BHARTIARTL';

        if (portRes.status === 200 && portRes.data) {
          const tv = portRes.data.totalValue || portRes.data.portfolio?.totalValue;
          if (tv) pv = tv;
          pos = portRes.data.holdings?.length || pos;
        }

        setStats({
          portfolioValue: kLakhs(pv),
          unrealisedPl: `+${(pnl / 1000).toFixed(1)}k`,
          positions: pos,
          bestPerformer: best
        });
      } catch (err) { }
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  // Date formatted like image
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="p-8 pb-20 max-w-[1600px] mx-auto space-y-6">
      {/* ── Header ── */}
      <header className="flex justify-between items-end mb-8 relative">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-1">Command Center</p>
          <h1 className="text-4xl font-serif tracking-tight">
            Welcome back, <span className="text-[#14b8a6] italic relative z-10">{user?.name || 'Investor'}</span>
          </h1>
          <p className="text-xs text-gray-500 flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-[#14b8a6]/50 shrink-0" />
            {today} - NSE/BSE Open
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE DATA
          </button>
          <Link
            to="/portfolio"
            className="px-4 py-1.5 rounded-full border border-[#1f2937] text-gray-400 text-xs font-semibold flex items-center gap-2 hover:text-white hover:border-gray-500 transition-colors"
          >
            Portfolio ⊙
          </Link>
        </div>
        {/* Subtle blur behind the name */}
        <div className="absolute top-4 left-44 w-32 h-16 bg-[#14b8a6]/10 blur-[40px] rounded-full pointer-events-none" />
      </header>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PV */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">Portfolio Value</p>
          <div>
            <p className="text-3xl font-bold text-[#14b8a6]">{stats.portfolioValue}</p>
            <p className="text-xs text-gray-500 mt-1">Total Market Value</p>
          </div>
          <span className="absolute top-6 right-6 text-[#14b8a6] opacity-50">💼</span>
        </div>
        {/* Unrealised P&L */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">Unrealised P&L</p>
          <div>
            <p className="text-3xl font-bold text-emerald-400">{stats.unrealisedPl}</p>
            <p className="text-xs text-gray-500 mt-1">+12.3% return</p>
          </div>
          <span className="absolute top-6 right-6 text-emerald-400 opacity-50 tracking-tighter shrink-0 pt-1">📈</span>
        </div>
        {/* Positions */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">Positions</p>
          <div>
            <p className="text-3xl font-bold text-yellow-500">{stats.positions}</p>
            <p className="text-xs text-gray-500 mt-1">7 sectors</p>
          </div>
          <span className="absolute top-6 right-6 text-yellow-500 opacity-50 pt-1">📊</span>
        </div>
        {/* Best Performer */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">Best Performer</p>
          <div>
            <p className="text-2xl font-bold text-[#8b5cf6]">{stats.bestPerformer}</p>
            <p className="text-xs text-gray-500 mt-1">+18.2% return</p>
          </div>
          <span className="absolute top-6 right-6 text-[#8b5cf6] opacity-50">🏆</span>
        </div>
      </div>

      {/* ── Main Grid Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Performance Chart */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Portfolio Performance - 30D</p>
              <span className="px-2.5 py-1 rounded border border-emerald-500/20 text-emerald-400 text-[10px] font-bold bg-emerald-500/10">^+12.3%</span>
            </div>
            <div className="h-64 mt-4 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                    itemStyle={{ color: '#14b8a6' }}
                    formatter={(val) => [`₹${(val / 100000).toFixed(2)}L`, 'Value']}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="val" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 border-b border-gray-800 pointer-events-none" style={{ top: '50%' }} />
              <div className="absolute inset-0 border-b border-gray-800 pointer-events-none" style={{ top: '25%' }} />
              <div className="absolute inset-0 border-b border-gray-800 pointer-events-none" style={{ top: '75%' }} />
            </div>
          </div>

          {/* Bottom Left ROW: Sector P&L + Market Movers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sector P&L */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                ⏱ Sector P&L Breakdown
              </p>
              <div className="space-y-4">
                {sectorBreakdown.map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-300">{s.name}</span>
                      <div className="flex gap-4">
                        <span className="text-emerald-400 font-medium">{s.val}</span>
                        <span className="text-gray-500 w-8 text-right">{s.pct}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full bg-[#14b8a6] rounded-full ${s.width}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Movers */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-6 flex items-center gap-2">
                ⚡ Market Movers Today
              </p>
              <div className="grid grid-cols-3 gap-3">
                {marketMovers.map((m) => (
                  <div key={m.t} className={`border rounded-lg p-2 text-center bg-[#0b101e] flex flex-col justify-center ${m.color}`}>
                    <span className="text-[10px] font-bold text-gray-300 tracking-wider mb-1">{m.t}</span>
                    <span className="text-[10px] font-bold">{m.c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Span 1) -> Top Holdings */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Top Holdings</p>
            <button className="text-[10px] text-gray-400 border border-[#1f2937] px-3 py-1 rounded hover:text-white transition-colors">View All</button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {topHoldings.map((h, i) => (
              <div key={h.ticker} className="flex justify-between items-center p-3 rounded-lg border border-[#1f2937] hover:bg-[#1a2332] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#1a2332] flex items-center justify-center text-[10px] font-bold text-[#14b8a6] border border-[#14b8a6]/20">
                    {h.ticker.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-200 tracking-wide">{h.ticker}</p>
                    <p className="text-[10px] text-gray-500">{h.shares} Sh.</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded text-center min-w-[50px]">
                  {h.pct}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 rounded-lg bg-[#14b8a6] text-[#0b101e] font-bold text-sm tracking-wide hover:bg-[#0f766e] transition-colors shadow-[0_0_15px_rgba(20,184,166,0.2)]">
            Full Portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
