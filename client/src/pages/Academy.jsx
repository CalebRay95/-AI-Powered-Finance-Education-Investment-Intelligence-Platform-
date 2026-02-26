import { useState } from 'react';

const MODS = [
  {
    id: 1, col: '#00e5ff', title: 'Market Fundamentals', desc: 'Core concepts every investor needs', lessons: 10, done: 10, locked: false,
    quiz: [
      { q: 'P/E ratio compares a company\'s stock price to:', opts: ['Total assets', 'Earnings per share', 'Revenue growth', 'Dividend yield'], ans: 1 },
      { q: 'A bear market is defined as a drop of at least:', opts: ['5%', '10%', '15%', '20%'], ans: 3 },
      { q: 'Market capitalisation equals:', opts: ['Total debt', 'Stock price × shares outstanding', 'Annual profit', 'Total revenue'], ans: 1 },
      { q: 'Which is a leading economic indicator?', opts: ['GDP', 'Consumer Price Index', 'Unemployment rate', 'Building permits'], ans: 3 },
    ]
  },
  {
    id: 2, col: '#00d68f', title: 'Technical Analysis', desc: 'Chart patterns and price action', lessons: 14, done: 9, locked: false,
    quiz: [
      { q: 'RSI stands for:', opts: ['Relative Strength Index', 'Real Stock Indicator', 'Risk Scale Index', 'Rapid Signal Indicator'], ans: 0 },
      { q: 'A "Golden Cross" is when:', opts: ['Price hits ATH', '50-day MA crosses above 200-day MA', 'Volume surges 200%', 'P/E exceeds 50'], ans: 1 },
      { q: 'Bollinger Bands primarily measure:', opts: ['Momentum', 'Trend direction', 'Volatility', 'Volume'], ans: 2 },
      { q: 'MACD is used to identify:', opts: ['Support levels', 'Trend changes and momentum', 'Dividend dates', 'Earnings beats'], ans: 1 },
    ]
  },
  {
    id: 3, col: '#f0a500', title: 'Fundamental Analysis', desc: 'Valuation and financial statements', lessons: 12, done: 4, locked: false,
    quiz: [
      { q: 'EBITDA stands for:', opts: ['Earnings Before Interest, Taxes, Depreciation & Amortization', 'Estimated Baseline Income Tax Analysis', 'Enterprise Book Interest Deficit', 'None of the above'], ans: 0 },
      { q: 'Free cash flow equals:', opts: ['Net income', 'Operating cash flow minus capex', 'Revenue minus COGS', 'EBITDA minus taxes'], ans: 1 },
      { q: 'A low Price/Book ratio may indicate:', opts: ['Overvaluation', 'Undervaluation or distress', 'High growth', 'Strong margins'], ans: 1 },
      { q: 'Return on Equity (ROE) measures:', opts: ['Asset efficiency', 'Profit relative to shareholder equity', 'Debt coverage', 'Revenue growth'], ans: 1 },
    ]
  },
  {
    id: 4, col: '#7c6af7', title: 'Portfolio Management', desc: 'Risk, allocation, and rebalancing', lessons: 11, done: 2, locked: false,
    quiz: [
      { q: 'Diversification primarily reduces:', opts: ['Systematic risk', 'Unsystematic risk', 'Market risk', 'Inflation risk'], ans: 1 },
      { q: 'Sharpe ratio measures:', opts: ['Total return', 'Risk-adjusted return per unit of risk', 'Volatility alone', 'Beta'], ans: 1 },
      { q: 'Rebalancing a portfolio means:', opts: ['Selling all positions', 'Restoring target asset allocation', 'Adding only new stocks', 'Reducing fees'], ans: 1 },
      { q: 'The efficient frontier represents:', opts: ['Maximum return portfolios', 'Optimal risk-return combinations', 'Zero-risk portfolios', 'Government bonds only'], ans: 1 },
    ]
  },
  { id: 5, col: '#f06292', title: 'Derivatives & Options', desc: 'Calls, puts, and hedging strategies', lessons: 16, done: 0, locked: true, quiz: [] },
  { id: 6, col: '#fbbf24', title: 'Crypto & DeFi', desc: 'Blockchain assets and protocols', lessons: 13, done: 0, locked: true, quiz: [] },
  { id: 7, col: '#34d399', title: 'Macro Economics', desc: 'Central banks, cycles and policy', lessons: 10, done: 0, locked: true, quiz: [] },
  { id: 8, col: '#fb7185', title: 'Risk Management', desc: 'Hedging, stop-loss, and position sizing', lessons: 9, done: 0, locked: true, quiz: [] },
];

const S = {
  sl: { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a5068' },
  card: { background: 'rgba(9,15,30,.9)', border: '1px solid #182236', borderRadius: 14, backdropFilter: 'blur(20px)' },
  mono: { fontFamily: "'JetBrains Mono',monospace" },
};

export default function Academy() {
  const [sel, setSel] = useState(null);
  const [ans, setAns] = useState({});
  const [sub, setSub] = useState(false);

  const score = sel ? sel.quiz.filter((q, i) => ans[i] === q.ans).length : 0;
  const totalDone = MODS.reduce((a, m) => a + m.done, 0);
  const totalLessons = MODS.reduce((a, m) => a + m.lessons, 0);

  return (
    <div style={{ padding: '26px 28px', maxWidth: 1280, fontFamily: "'DM Sans',sans-serif", color: '#c8d8e8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .mod-card:hover{border-color:var(--mc)!important;transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.5)}
        .mod-card{transition:all .2s}
        .opt-row:hover{border-color:var(--oc)!important;background:rgba(255,255,255,.04)!important}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ ...S.sl, marginBottom: 5 }}>Learning Center</div>
        <h2 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 24, fontWeight: 400, margin: 0 }}>
          Finance <em style={{ color: '#00e5ff' }}>Academy</em>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ flex: 1, maxWidth: 300, height: 5, borderRadius: 99, background: '#0c1424', overflow: 'hidden' }}>
            <div style={{ width: `${(totalDone / totalLessons) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#00b8d4,#00e5ff)' }} />
          </div>
          <span style={{ fontSize: 12, color: '#3a5068' }}>{totalDone}/{totalLessons} lessons · {Math.round(totalDone / totalLessons * 100)}%</span>
        </div>
      </div>

      {/* Module Grid */}
      {!sel && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {MODS.map(m => (
            <div key={m.id} className="mod-card" style={{ '--mc': m.col, ...S.card, padding: 22, opacity: m.locked ? .45 : 1, cursor: m.locked ? 'not-allowed' : 'pointer' }}
              onClick={() => !m.locked && (setSel(m), setAns({}), setSub(false))}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.col}15`, border: `1px solid ${m.col}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18, color: m.col, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                {m.id}
              </div>
              {m.locked && (
                <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 6, fontWeight: 600, background: 'rgba(240,165,0,.1)', color: '#fbbf24', border: '1px solid rgba(240,165,0,.2)', marginBottom: 10, display: 'inline-block' }}>LOCKED</span>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: '#3a5068', marginBottom: 14, lineHeight: 1.5 }}>{m.desc}</div>
              <div style={{ fontSize: 11, color: '#3a5068', marginBottom: 8, display: 'flex', gap: 12 }}>
                <span>{m.lessons} lessons</span>
                {m.quiz.length > 0 && <span>{m.quiz.length} quiz questions</span>}
              </div>
              <div style={{ height: 4, borderRadius: 99, background: '#0c1424', marginBottom: 6, overflow: 'hidden' }}>
                <div style={{ width: `${(m.done / m.lessons) * 100}%`, height: '100%', background: m.col, transition: 'width .6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#3a5068' }}>
                <span>{m.done}/{m.lessons}</span>
                <span style={{ color: m.done === m.lessons ? '#00d68f' : '#3a5068' }}>
                  {m.done === m.lessons ? 'Complete' : `${Math.round(m.done / m.lessons * 100)}%`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz view */}
      {sel && !sub && (
        <div style={{ ...S.card, maxWidth: 680, padding: 30 }}>
          <button onClick={() => setSel(null)} style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#7090a8', fontFamily: "'DM Sans',sans-serif", borderRadius: 9, cursor: 'pointer', padding: '6px 14px', fontSize: 13, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Modules
          </button>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 26 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: `${sel.col}15`, border: `1px solid ${sel.col}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, ...S.mono, fontWeight: 700, color: sel.col }}>
              {sel.id}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 3 }}>{sel.title}</div>
              <div style={{ color: '#3a5068', fontSize: 13 }}>{sel.quiz.length}-question assessment</div>
            </div>
          </div>
          {sel.quiz.map((q, qi) => (
            <div key={qi} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: `${sel.col}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: sel.col, flexShrink: 0 }}>{qi + 1}</span>
                {q.q}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.opts.map((opt, oi) => (
                  <div key={oi} className="opt-row" onClick={() => setAns({ ...ans, [qi]: oi })}
                    style={{ '--oc': sel.col, padding: '10px 15px', borderRadius: 9, border: `1px solid ${ans[qi] === oi ? sel.col : '#1e2d45'}`, background: ans[qi] === oi ? `${sel.col}0c` : '#090f1e', cursor: 'pointer', fontSize: 13.5, transition: 'all .15s', color: ans[qi] === oi ? sel.col : '#7090a8', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${ans[qi] === oi ? sel.col : '#1e2d45'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {ans[qi] === oi && <div style={{ width: 8, height: 8, borderRadius: '50%', background: sel.col }} />}
                    </div>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => Object.keys(ans).length === sel.quiz.length && setSub(true)}
            disabled={Object.keys(ans).length < sel.quiz.length}
            style={{ padding: '12px 28px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, opacity: Object.keys(ans).length < sel.quiz.length ? .5 : 1 }}>
            Submit Assessment
          </button>
        </div>
      )}

      {/* Results */}
      {sel && sub && (
        <div style={{ ...S.card, maxWidth: 540, padding: 36, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `${sel.col}18`, border: `1px solid ${sel.col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 28, color: sel.col, ...S.mono, fontWeight: 900 }}>
            {score >= sel.quiz.length ? 'A+' : score >= sel.quiz.length / 2 ? 'B' : 'C'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, color: sel.col, ...S.mono }}>{score} / {sel.quiz.length}</div>
          <div style={{ color: '#3a5068', marginBottom: 24 }}>
            {score === sel.quiz.length ? 'Perfect score — excellent mastery!' : score >= sel.quiz.length / 2 ? 'Good work — review missed concepts' : 'Keep studying — you\'ll get there!'}
          </div>
          {sel.quiz.map((q, qi) => (
            <div key={qi} style={{ padding: '11px 14px', background: '#090f1e', borderRadius: 9, border: `1px solid ${ans[qi] === q.ans ? 'rgba(0,214,143,.25)' : 'rgba(255,61,90,.25)'}`, marginBottom: 9, textAlign: 'left' }}>
              <div style={{ fontSize: 12, marginBottom: 4, color: '#c8d8e8' }}>{q.q}</div>
              <div style={{ fontSize: 12, color: ans[qi] === q.ans ? '#00d68f' : '#ff3d5a', fontWeight: 700 }}>
                {ans[qi] === q.ans ? 'Correct!' : `Wrong — ${q.opts[q.ans]}`}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <button onClick={() => { setAns({}); setSub(false); }} style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', color: '#030711', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>Retry Quiz</button>
            <button onClick={() => setSel(null)} style={{ padding: '10px 22px', background: 'transparent', border: '1px solid #1e2d45', color: '#7090a8', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>All Modules</button>
          </div>
        </div>
      )}
    </div>
  );
}
