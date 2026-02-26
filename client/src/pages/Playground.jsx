import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import api from '../utils/api.js';

/* ── FAANG tickers backed by the real CSV-trained ML model ─────────────────── */
const STOCKS = {
  AAPL: { name: 'Apple Inc.', col: '#00e5ff', sec: 'Technology' },
  AMZN: { name: 'Amazon.com Inc.', col: '#f0a500', sec: 'E-Commerce' },
  GOOGL: { name: 'Alphabet Inc.', col: '#00d68f', sec: 'Technology' },
  META: { name: 'Meta Platforms Inc.', col: '#7c6af7', sec: 'Social Media' },
  MSFT: { name: 'Microsoft Corp.', col: '#34d399', sec: 'Technology' },
  NVDA: { name: 'NVIDIA Corp.', col: '#f97316', sec: 'Semiconductors' },
};
const TICKERS = Object.keys(STOCKS);

const ML_BASE = import.meta.env.VITE_ML_URL || 'http://localhost:8000';
const NODE_API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── RSI helper ────────────────────────────────────────────────────────────── */
function calcRSI(closes, p = 14) {
  const gains = [], losses = [];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gains.push(d > 0 ? d : 0);
    losses.push(d < 0 ? -d : 0);
  }
  return closes.map((_, i) => {
    if (i < p) return { i, rsi: 50 };
    const ag = gains.slice(i - p, i).reduce((a, b) => a + b, 0) / p;
    const al = losses.slice(i - p, i).reduce((a, b) => a + b, 0) / p;
    const rs = al === 0 ? 100 : ag / al;
    return { i, rsi: +(100 - 100 / (1 + rs)).toFixed(1) };
  });
}

/* ── Mini confidence arc ────────────────────────────────────────────────────── */
function ConfArc({ val, color = '#00e5ff', size = 100 }) {
  const r = 38, circ = 2 * Math.PI * r, off = circ - (val / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#141f30" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
      <text x="50" y="44" textAnchor="middle" fill={color} fontSize="16" fontFamily="JetBrains Mono" fontWeight="700">{val}</text>
      <text x="50" y="58" textAnchor="middle" fill="#3a5068" fontSize="9" fontFamily="JetBrains Mono">CONF %</text>
    </svg>
  );
}

function Spin({ size = 14 }) {
  return <span style={{ width: size, height: size, border: '2px solid rgba(255,255,255,.18)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .65s linear infinite', display: 'inline-block', flexShrink: 0 }} />;
}

export default function Playground() {
  const [tk, setTk] = useState('AAPL');
  const [chartData, setChart] = useState([]);
  const [chartLoading, setCL] = useState(false);
  const [mlData, setML] = useState(null);    // real ML prediction response
  const [mlLoading, setMLL] = useState(false);
  const [pick, setPick] = useState(null);    // user's UP/DOWN choice
  const [phase, setPhase] = useState('idle');  // idle | predicting | result
  const [result, setResult] = useState(null);
  const [hist, setHist] = useState([]);
  const [err, setErr] = useState('');
  const tmr = useRef(null);

  const s = STOCKS[tk];
  const rsiData = chartData.length > 0
    ? calcRSI(chartData.map(d => d.close))
    : [];
  const latestRSI = rsiData[rsiData.length - 1]?.rsi ?? 50;

  /* Fetch real chart data from ML service (uses CSV for FAANG) */
  const fetchChart = useCallback(async (ticker) => {
    setCL(true); setErr(''); setChart([]);
    try {
      const res = await fetch(`${ML_BASE}/prediction/chart/${ticker}`);
      if (!res.ok) throw new Error(`Chart ${res.status}`);
      const data = await res.json();
      setChart(data);
    } catch (e) {
      setErr(`Chart load failed for ${ticker}: ${e.message}`);
    } finally { setCL(false); }
  }, []);

  /* Fetch real ML prediction (XGBoost + LSTM ensemble trained on CSV) */
  const fetchML = useCallback(async (ticker) => {
    setMLL(true); setML(null);
    try {
      const res = await api.get(`/api/prediction/ai/${ticker}`);
      setML(res.data);
    } catch (e) {
      setErr(prev => prev + ` ML: ${e.response?.data?.detail || e.message}`);
    } finally { setMLL(false); }
  }, []);

  /* Load history on mount */
  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/api/prediction/history');
      setHist(data || []);
    } catch (_) { }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /* Auto-load when ticker changes */
  useEffect(() => {
    setPhase('idle'); setResult(null); setPick(null); setML(null); setErr('');
    clearTimeout(tmr.current);
    fetchChart(tk);
    fetchML(tk);
  }, [tk, fetchChart, fetchML]);

  /* Submit prediction */
  const predict = async (dir) => {
    if (!mlData || phase !== 'idle') return;
    setPick(dir); setPhase('predicting');
    try {
      const { data } = await api.post('/api/prediction/submit', {
        ticker: tk,
        userPrediction: dir,
        aiPrediction: mlData.aiPrediction,
        confidence: mlData.confidence,
        featureImportance: mlData.featureImportance,
      });
      setResult(data); setPhase('result');
      fetchHistory();
    } catch (e) {
      setErr(e.response?.data?.message || 'Submission failed.'); setPhase('idle');
    }
  };

  const reset = () => {
    setPhase('idle'); setResult(null); setPick(null);
    fetchChart(tk); fetchML(tk);
  };

  const curPrice = chartData[chartData.length - 1]?.close ?? mlData?.current_price ?? 0;
  const confPct = mlData ? Math.round(mlData.confidence * 100) : 0;

  const S = {
    page: { padding: '24px 26px', maxWidth: 1280, fontFamily: "'DM Sans',sans-serif", color: '#c8d8e8' },
    sl: { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a5068' },
    card: { background: 'rgba(9,15,30,.9)', border: '1px solid #182236', borderRadius: 14, backdropFilter: 'blur(18px)' },
    mono: { fontFamily: "'JetBrains Mono',monospace" },
  };

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .tk-btn:hover{border-color:#00e5ff!important;color:#c8d8e8!important}
        .hist-row:hover{background:rgba(0,229,255,.03)!important}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ ...S.sl, marginBottom: 4 }}>Prediction Engine · ML-Powered</div>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, margin: '0 0 3px' }}>
          Stock <em style={{ color: '#00e5ff' }}>Predictor</em>
        </h2>
        <p style={{ color: '#3a5068', fontSize: 12 }}>
          XGBoost + LSTM ensemble trained on FAANG dataset (R² ≈ 99.8%) — real data from <span style={{ color: '#00e5ff' }}>faang_stock_prices.csv</span>
        </p>
      </div>

      {/* Ticker selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ ...S.sl, marginBottom: 7 }}>Select Ticker (CSV-backed)</div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {TICKERS.map(t => (
            <button key={t} className="tk-btn" onClick={() => setTk(t)}
              style={{ background: tk === t ? `${STOCKS[t].col}18` : 'transparent', border: `1px solid ${tk === t ? STOCKS[t].col : '#1e2d45'}`, color: tk === t ? STOCKS[t].col : '#7090a8', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, borderRadius: 9, cursor: 'pointer', transition: 'all .18s', padding: '6px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: tk === t ? STOCKS[t].col : '#3a5068', display: 'inline-block' }} />
              {t}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div style={{ marginBottom: 14, padding: '9px 14px', background: 'rgba(255,61,90,.07)', border: '1px solid rgba(255,61,90,.22)', borderRadius: 9, fontSize: 12, color: '#ff3d5a' }}>{err}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Left: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stock header bar */}
          <div style={{ ...S.card, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.col}18`, border: `1px solid ${s.col}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: s.col, ...S.mono }}>{tk.slice(0, 2)}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#3a5068' }}>{s.sec} · NASDAQ</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                  {chartLoading ? <Spin /> : (
                    <span style={{ ...S.mono, fontSize: 28, fontWeight: 700, color: s.col }}>
                      ${curPrice.toFixed(2)}
                    </span>
                  )}
                  {mlData && (
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, fontWeight: 600, background: mlData.aiPrediction === 'UP' ? 'rgba(0,214,143,.1)' : 'rgba(255,61,90,.1)', color: mlData.aiPrediction === 'UP' ? '#00d68f' : '#ff3d5a', border: `1px solid ${mlData.aiPrediction === 'UP' ? 'rgba(0,214,143,.22)' : 'rgba(255,61,90,.22)'}` }}>
                      ML: {mlData.aiPrediction} {mlData.pct_change >= 0 ? '+' : ''}{mlData.pct_change?.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...S.sl, marginBottom: 4 }}>From CSV Dataset</div>
                <div style={{ fontSize: 12, color: '#3a5068' }}>Last date: {chartData[chartData.length - 1]?.date || '—'}</div>
                {mlData?.r2_score && <div style={{ fontSize: 11, color: '#00d68f', ...S.mono, marginTop: 3 }}>R² = {mlData.r2_score}%</div>}
              </div>
            </div>
          </div>

          {/* Price chart */}
          <div style={{ ...S.card, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={S.sl}>30-Day Close Price · CSV Data</div>
              {chartLoading && <Spin />}
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.col} stopOpacity={.22} />
                      <stop offset="100%" stopColor={s.col} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(24,34,54,.7)" />
                  <XAxis dataKey="date" stroke="#3a5068" tick={{ fontSize: 9 }} tickFormatter={d => d?.slice(5)} interval={4} />
                  <YAxis stroke="#3a5068" tick={{ fontSize: 9 }} tickFormatter={v => `$${v.toFixed(0)}`} domain={['auto', 'auto']} width={52} />
                  <Tooltip contentStyle={{ background: '#090f1e', border: '1px solid #182236', borderRadius: 9, fontSize: 12 }} formatter={v => [`$${Number(v).toFixed(2)}`, 'Close']} />
                  <Area type="monotone" dataKey="close" stroke={s.col} fill="url(#cg)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  {/* ML predicted price as reference line */}
                  {mlData?.predicted_price && (
                    <ReferenceLine y={mlData.predicted_price} stroke={mlData.aiPrediction === 'UP' ? '#00d68f' : '#ff3d5a'} strokeDasharray="4 3" label={{ value: `ML Target $${mlData.predicted_price.toFixed(2)}`, fill: '#7090a8', fontSize: 9 }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : !chartLoading ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a5068', fontSize: 13 }}>No chart data</div>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size={24} /></div>
            )}
          </div>

          {/* RSI + Volume */}
          {chartData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ ...S.card, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={S.sl}>RSI (14)</div>
                  <span style={{ ...S.mono, fontSize: 12, color: latestRSI > 70 ? '#ff3d5a' : latestRSI < 30 ? '#00d68f' : '#7c6af7', fontWeight: 700 }}>{latestRSI}</span>
                </div>
                <ResponsiveContainer width="100%" height={75}>
                  <AreaChart data={rsiData.slice(-20)}>
                    <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c6af7" stopOpacity={.25} /><stop offset="100%" stopColor="#7c6af7" stopOpacity={0} /></linearGradient></defs>
                    <YAxis domain={[0, 100]} stroke="#3a5068" tick={{ fontSize: 8 }} width={20} />
                    <Tooltip contentStyle={{ background: '#090f1e', border: '1px solid #182236', borderRadius: 8, fontSize: 11 }} />
                    <ReferenceLine y={70} stroke="rgba(255,61,90,.4)" strokeDasharray="3 3" />
                    <ReferenceLine y={30} stroke="rgba(0,214,143,.4)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="rsi" stroke="#7c6af7" fill="url(#rg)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...S.card, padding: '14px 16px' }}>
                <div style={{ ...S.sl, marginBottom: 8 }}>Volume (30d)</div>
                <ResponsiveContainer width="100%" height={75}>
                  <BarChart data={chartData.slice(-20)}>
                    <YAxis stroke="#3a5068" tick={{ fontSize: 8 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} width={24} />
                    <Tooltip contentStyle={{ background: '#090f1e', border: '1px solid #182236', borderRadius: 8, fontSize: 11 }} formatter={v => [`${(v / 1e6).toFixed(1)}M`, 'Vol']} />
                    <Bar dataKey="volume" fill={`${s.col}55`} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Prediction history */}
          {hist.length > 0 && (
            <div style={{ ...S.card, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #182236', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={S.sl}>Prediction History</div>
                <div style={{ fontSize: 12, color: '#3a5068' }}>{hist.length} records</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: '#3a5068', borderBottom: '1px solid #182236', textAlign: 'left' }}>
                      {['Ticker', 'You', 'AI', 'Actual', 'P&L', 'Date'].map(h => <th key={h} style={{ padding: '8px 14px', fontWeight: 600, fontSize: 11 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {hist.slice(0, 8).map((p, i) => (
                      <tr key={i} className="hist-row" style={{ borderBottom: '1px solid rgba(24,34,54,.8)' }}>
                        <td style={{ padding: '7px 14px', ...S.mono, fontWeight: 700, color: STOCKS[p.ticker]?.col || '#00e5ff' }}>{p.ticker}</td>
                        <td style={{ padding: '7px 14px', color: p.userPrediction === 'UP' ? '#00d68f' : '#ff3d5a', fontWeight: 600 }}>{p.userPrediction === 'UP' ? '▲ LONG' : '▼ SHORT'}</td>
                        <td style={{ padding: '7px 14px', color: p.aiPrediction === 'UP' ? '#00d68f' : '#ff3d5a', fontWeight: 600 }}>{p.aiPrediction === 'UP' ? '▲' : '▼'} {p.aiPrediction}</td>
                        <td style={{ padding: '7px 14px', color: p.actualOutcome === 'UP' ? '#00d68f' : p.actualOutcome === 'DOWN' ? '#ff3d5a' : '#7090a8' }}>{p.actualOutcome}</td>
                        <td style={{ padding: '7px 14px', ...S.mono, fontSize: 11, color: p.priceChangePct >= 0 ? '#00d68f' : '#ff3d5a' }}>{p.priceChangePct != null ? `${p.priceChangePct >= 0 ? '+' : ''}${p.priceChangePct.toFixed(2)}%` : '—'}</td>
                        <td style={{ padding: '7px 14px', color: '#3a5068' }}>{new Date(p.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: ML prediction panel + pick buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ML prediction card */}
          <div style={{ ...S.card, padding: 20, borderColor: mlData ? `${s.col}25` : '#182236' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={S.sl}>ML Model Prediction</div>
              {mlLoading && <Spin />}
            </div>

            {mlLoading && !mlData ? (
              <div style={{ color: '#3a5068', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Training XGBoost+LSTM ensemble…
              </div>
            ) : mlData ? (
              <div>
                {/* Confidence arc + direction */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <ConfArc val={confPct} color={mlData.aiPrediction === 'UP' ? '#00d68f' : '#ff3d5a'} />
                  <div>
                    <div style={{ ...S.sl, marginBottom: 5 }}>Direction</div>
                    <div style={{ fontSize: 26, fontWeight: 800, ...S.mono, color: mlData.aiPrediction === 'UP' ? '#00d68f' : '#ff3d5a' }}>
                      {mlData.aiPrediction === 'UP' ? '▲ LONG' : '▼ SHORT'}
                    </div>
                    <div style={{ fontSize: 11, color: '#3a5068', marginTop: 4 }}>
                      Model: {mlData.model?.split('(')[0]?.trim() || 'XGBoost+LSTM'}
                    </div>
                  </div>
                </div>

                {/* Price predictions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { lbl: 'Current', val: `$${mlData.current_price?.toFixed(2)}`, col: '#7090a8' },
                    { lbl: 'ML Target', val: `$${mlData.predicted_price?.toFixed(2)}`, col: mlData.aiPrediction === 'UP' ? '#00d68f' : '#ff3d5a' },
                  ].map(r => (
                    <div key={r.lbl} style={{ background: '#090f1e', borderRadius: 8, padding: '10px 12px', border: '1px solid #182236' }}>
                      <div style={{ fontSize: 10, color: '#3a5068', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>{r.lbl}</div>
                      <div style={{ ...S.mono, fontSize: 16, fontWeight: 700, color: r.col }}>{r.val}</div>
                    </div>
                  ))}
                </div>

                {/* R² and source */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 6, background: 'rgba(0,214,143,.09)', color: '#00d68f', border: '1px solid rgba(0,214,143,.2)', ...S.mono, fontWeight: 600 }}>R² {mlData.r2_score}%</span>
                  <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 6, background: mlData.source === 'csv' ? 'rgba(0,229,255,.08)' : 'rgba(240,165,0,.08)', color: mlData.source === 'csv' ? '#00e5ff' : '#f0a500', border: `1px solid ${mlData.source === 'csv' ? 'rgba(0,229,255,.2)' : 'rgba(240,165,0,.2)'}` }}>
                    {mlData.source === 'csv' ? 'CSV dataset' : 'yfinance'}
                  </span>
                </div>

                {/* Explanation */}
                {mlData.explanation && (
                  <div style={{ fontSize: 12, lineHeight: 1.7, color: '#7090a8', padding: '9px 11px', background: '#0c1424', borderRadius: 8, borderLeft: '3px solid #00e5ff', marginBottom: 12 }}>
                    {mlData.explanation}
                  </div>
                )}

                {/* Top features */}
                {mlData.featureImportance && (
                  <div>
                    <div style={{ ...S.sl, marginBottom: 7 }}>Top Features</div>
                    {Object.entries(mlData.featureImportance)
                      .sort((a, b) => b[1] - a[1]).slice(0, 5)
                      .map(([feat, imp]) => (
                        <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: '#7090a8', width: 94, flexShrink: 0 }}>{feat}</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#0c1424', overflow: 'hidden' }}>
                            <div style={{ width: `${(imp * 100).toFixed(1)}%`, height: '100%', background: s.col, borderRadius: 99 }} />
                          </div>
                          <span style={{ ...S.mono, fontSize: 10, color: '#3a5068', width: 36, textAlign: 'right' }}>{(imp * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#3a5068', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No prediction loaded</div>
            )}
          </div>

          {/* Prediction action card */}
          <div style={{ ...S.card, padding: 20 }}>
            {phase === 'idle' && (
              <div>
                <div style={{ ...S.sl, marginBottom: 8 }}>Your Prediction</div>
                <p style={{ fontSize: 13, color: '#3a5068', marginBottom: 16, lineHeight: 1.65 }}>
                  Will <span style={{ color: s.col, fontWeight: 700 }}>{tk}</span> close higher or lower next session?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => predict('UP')} disabled={!mlData || mlLoading}
                    style={{ padding: 15, fontSize: 16, fontWeight: 800, background: 'rgba(0,214,143,.07)', border: '2px solid #00d68f', borderRadius: 11, color: '#00d68f', cursor: !mlData ? 'not-allowed' : 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: 'all .2s', opacity: !mlData ? .5 : 1 }}
                    onMouseEnter={e => mlData && (e.currentTarget.style.background = 'rgba(0,214,143,.14)')}
                    onMouseLeave={e => mlData && (e.currentTarget.style.background = 'rgba(0,214,143,.07)')}>
                    ▲ LONG
                  </button>
                  <button onClick={() => predict('DOWN')} disabled={!mlData || mlLoading}
                    style={{ padding: 15, fontSize: 16, fontWeight: 800, background: 'rgba(255,61,90,.07)', border: '2px solid #ff3d5a', borderRadius: 11, color: '#ff3d5a', cursor: !mlData ? 'not-allowed' : 'pointer', fontFamily: "'JetBrains Mono',monospace", transition: 'all .2s', opacity: !mlData ? .5 : 1 }}
                    onMouseEnter={e => mlData && (e.currentTarget.style.background = 'rgba(255,61,90,.14)')}
                    onMouseLeave={e => mlData && (e.currentTarget.style.background = 'rgba(255,61,90,.07)')}>
                    ▼ SHORT
                  </button>
                </div>
                {!mlData && <p style={{ fontSize: 11, color: '#3a5068', marginTop: 10, textAlign: 'center' }}>Waiting for ML model to load…</p>}
              </div>
            )}
            {phase === 'predicting' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin size={22} />
                <div style={{ color: '#7090a8', fontSize: 13, marginTop: 10 }}>Saving prediction…</div>
              </div>
            )}
            {phase === 'result' && result && (
              <div>
                <div style={{ ...S.sl, marginBottom: 10 }}>Result for {result.ticker}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { lbl: 'You', val: result.userPrediction, ok: result.userPrediction === result.actualOutcome },
                    { lbl: 'AI', val: result.aiPrediction, ok: result.aiPrediction === result.actualOutcome },
                    { lbl: 'Actual', val: result.actualOutcome, ok: null },
                  ].map(r => (
                    <div key={r.lbl} style={{ textAlign: 'center', padding: '11px 7px', borderRadius: 9, background: '#090f1e', border: `1px solid ${r.lbl === 'Actual' ? 'rgba(0,229,255,.18)' : '#182236'}` }}>
                      <div style={{ fontSize: 9, letterSpacing: '.1em', color: '#3a5068', marginBottom: 4, fontWeight: 700 }}>{r.lbl}</div>
                      <div style={{ fontSize: 20, color: r.val === 'UP' ? '#00d68f' : r.val === 'DOWN' ? '#ff3d5a' : '#7090a8' }}>{r.val === 'UP' ? '▲' : r.val === 'DOWN' ? '▼' : '—'}</div>
                      {r.ok !== null && <div style={{ fontSize: 9, marginTop: 3, fontWeight: 700, color: r.ok ? '#00d68f' : '#ff3d5a' }}>{r.ok ? 'Correct' : 'Wrong'}</div>}
                    </div>
                  ))}
                </div>
                <button style={{ width: '100%', padding: 11, fontSize: 14, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }} onClick={reset}>
                  New Prediction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
