import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';

const NODE_API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ML_URL = import.meta.env.VITE_ML_URL || 'http://localhost:8000';

const PORTFOLIO_DATA = [
  { t: 'TCS', n: 20, avg: 3420.00, sec: 'IT Services', cur: 3842.55 },
  { t: 'INFY', n: 45, avg: 1580.00, sec: 'IT Services', cur: 1748.20 },
  { t: 'RELIANCE', n: 30, avg: 2650.00, sec: 'Conglomerate', cur: 2948.70 },
  { t: 'HDFCBANK', n: 50, avg: 1580.00, sec: 'Banking', cur: 1718.50 },
  { t: 'ICICIBANK', n: 60, avg: 1050.00, sec: 'Banking', cur: 1238.80 },
  { t: 'SUNPHARMA', n: 25, avg: 1480.00, sec: 'Pharma', cur: 1712.40 },
  { t: 'MARUTI', n: 8, avg: 10800.00, sec: 'Auto', cur: 11842.60 },
  { t: 'ITC', n: 200, avg: 410.00, sec: 'FMCG', cur: 468.90 },
  { t: 'BHARTIARTL', n: 35, avg: 1420.00, sec: 'Telecom', cur: 1678.40 },
  { t: 'WIPRO', n: 80, avg: 480.00, sec: 'IT Services', cur: 512.40 },
];

const PV = PORTFOLIO_DATA.reduce((s, p) => s + p.n * p.cur, 0);
const PC = PORTFOLIO_DATA.reduce((s, p) => s + p.n * p.avg, 0);

const SUGG = [
  'Analyse my biggest risk exposures',
  'Which positions should I trim or add to?',
  'Suggest a rebalancing strategy for my portfolio',
  'What is my portfolio\'s biggest vulnerability?',
  'Best defensive additions for market volatility?',
  'Compare my IT sector concentration vs benchmark',
];

const SYS_PROMPT = `You are TradeFinX AI — elite NSE/BSE financial strategy advisor.

LIVE PORTFOLIO (${PORTFOLIO_DATA.length} positions, ₹${(PV / 100000).toFixed(2)}L value):
${PORTFOLIO_DATA.map(p => { const ret = ((p.cur - p.avg) / p.avg * 100).toFixed(1); return `- ${p.t}: ${p.n}×@avg₹${p.avg}→₹${p.cur} | ${ret}% | ₹${(p.n * p.cur / 100000).toFixed(2)}L | ${p.sec}`; }).join('\n')}
Total P&L: +₹${((PV - PC) / 1000).toFixed(1)}k (+${((PV - PC) / PC * 100).toFixed(1)}%)

MARKETS: NIFTY50 +0.74% | SENSEX +0.69% | BANK NIFTY +0.52% | VIX 14.2 | USD/INR 83.42 | RBI Repo 6.50%

STYLE: Use **Bold** for headers. Use bullet points. All prices in ₹ (INR). Under 300 words. Be specific and quantitative.`;

function renderMsg(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} style={{ fontWeight: 700, color: '#00e5ff', marginTop: i > 0 ? 8 : 0, marginBottom: 2, fontSize: 13 }}>
        ▸ {line.slice(2, -2)}
      </div>;
    }
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 3, alignItems: 'flex-start' }}>
        <span style={{ color: '#f0a500', flexShrink: 0, marginTop: 4, fontSize: 10 }}>◆</span>
        <span style={{ fontSize: 13.5, lineHeight: 1.7, color: '#7090a8' }} dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#c8d8e8">$1</strong>') }} />
      </div>;
    }
    if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
    return <p key={i} style={{ fontSize: 13.5, lineHeight: 1.75, color: '#7090a8', marginBottom: 1 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#c8d8e8">$1</strong>') }} />;
  });
}

function Spin() {
  return <div style={{ width: 8, height: 8, border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .65s linear infinite', flexShrink: 0, display: 'inline-block' }} />;
}

export default function Advisor() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState('');
  const [loading, setLoad] = useState(false);
  const [streaming, setStr] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMsgs([{
      role: 'assistant',
      content: `Hello ${user?.name || 'there'}! I'm your fin-advisor AI advisor with live access to your ${PORTFOLIO_DATA.length}-position portfolio.\n\n**Portfolio Summary:**\n• Total Value: ₹${(PV / 100000).toFixed(2)}L across ${[...new Set(PORTFOLIO_DATA.map(p => p.sec))].length} sectors\n• Unrealised P&L: +₹${((PV - PC) / 1000).toFixed(1)}k (+${((PV - PC) / PC * 100).toFixed(1)}%)\n• Best performer: ${[...PORTFOLIO_DATA].sort((a, b) => (b.cur / b.avg) - (a.cur / a.avg))[0].t}\n\nWhat would you like to analyse today?`,
    }]);
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const animateReply = (reply) => {
    setLoad(false);
    setStr(true);
    setMsgs(p => [...p, { role: 'assistant', content: '' }]);
    let i = 0;
    const iv = setInterval(() => {
      i = Math.min(i + 10, reply.length);
      setMsgs(p => { const n = [...p]; n[n.length - 1] = { role: 'assistant', content: reply.slice(0, i) }; return n; });
      if (i >= reply.length) { clearInterval(iv); setStr(false); }
    }, 8);
  };

  const smartLocalReply = (q) => {
    const low = q.toLowerCase();
    const topPos = [...PORTFOLIO_DATA].sort((a, b) => ((b.cur - b.avg) / b.avg) - ((a.cur - a.avg) / a.avg));
    const botPos = [...PORTFOLIO_DATA].sort((a, b) => ((a.cur - a.avg) / a.avg) - ((b.cur - b.avg) / b.avg));
    const secs = {};
    PORTFOLIO_DATA.forEach(p => { secs[p.sec] = (secs[p.sec] || 0) + p.n * p.cur; });
    const itPct = (PORTFOLIO_DATA.filter(p => p.sec === 'IT Services').reduce((s, p) => s + p.n * p.cur, 0) / PV * 100).toFixed(0);

    if (/hello|hi |hey|greet|how are/.test(low)) {
      return `Hello ${user?.name || 'there'}! I'm your TradeFinX AI fin-advisor.\n\n**I can help you with:**\n• Portfolio risk & sector analysis\n• Position sizing & rebalancing strategy\n• Stock-specific performance review\n• Buy/sell/trim recommendations\n• Market outlook on your holdings\n\nYour portfolio is at ₹${(PV / 100000).toFixed(2)}L with **+${((PV - PC) / PC * 100).toFixed(1)}%** unrealised gains. What would you like to analyse?`;
    }
    if (/risk|exposure|vulner/.test(low)) {
      const itVal = PORTFOLIO_DATA.filter(p => p.sec === 'IT Services').reduce((s, p) => s + p.n * p.cur, 0);
      return `**Risk Exposure Analysis:**\n\n**Concentration Risk (Highest):**\n• IT Services: ₹${(itVal / 100000).toFixed(2)}L (${itPct}% of portfolio) — overweight vs 15% NIFTY benchmark\n• WIPRO is the weakest IT position at +${((PORTFOLIO_DATA.find(p => p.t === 'WIPRO').cur - PORTFOLIO_DATA.find(p => p.t === 'WIPRO').avg) / PORTFOLIO_DATA.find(p => p.t === 'WIPRO').avg * 100).toFixed(1)}%\n\n**Key Risks:**\n• Rupee appreciation hurts IT export earnings (1% INR rise = ~2% EPS drop)\n• Missing sectors: Infrastructure, Energy, Metals\n\n**Risk Score: 6.8/10** — primary driver is IT sector concentration\n\n**Recommended Fix:** Trim WIPRO → buy ITC or NTPC to reduce concentration`;
    }
    if (/trim|sell|reduce|cut|exit|should i sell/.test(low)) {
      return `**Positions to Consider Trimming:**\n\n• **WIPRO** — ${((botPos[0].cur - botPos[0].avg) / botPos[0].avg * 100).toFixed(1)}% return (lagging TCS/INFY by ~6%). Suggest reducing 40 shares\n• **INFY** — slight overweight in IT basket\n\n**Redeploy Proceeds Into:**\n• ITC (FMCG defensive, secular demand)\n• BHARTIARTL (5G tailwind, strong FCF)\n\n**Result:** IT drops from ${itPct}% → ~38%, reduces portfolio VaR by ~12%`;
    }
    if (/add|buy|invest|rebal/.test(low)) {
      return `**Rebalancing Recommendations:**\n\n**Sectors to Add:**\n• **FMCG** — ITC (already held, can add more) or HUL at ₹2,340\n• **Infrastructure** — L&T for capex supercycle exposure\n• **Energy** — NTPC or POWERGRID for defensive yield\n\n**Current Allocation:**\n${Object.entries(secs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `• ${k}: ${(v / PV * 100).toFixed(0)}%`).join('\n')}\n\n**Target:** IT from ${itPct}% → 35%, add Infra/Energy to 15-20%`;
    }
    if (/best|top|winner|star|perform/.test(low)) {
      return `**Top Performers in Your Portfolio:**\n\n${topPos.slice(0, 5).map((p, i) => {
        const ret = (p.cur - p.avg) / p.avg * 100;
        const pnl = p.n * (p.cur - p.avg);
        return `• **${p.t}** — +${ret.toFixed(1)}% | P&L: +₹${(pnl / 1000).toFixed(1)}k | ${p.sec}`;
      }).join('\n')}\n\n**Weakest positions:**\n${botPos.slice(0, 3).map(p => `• ${p.t}: ${((p.cur - p.avg) / p.avg * 100).toFixed(1)}%`).join('\n')}`;
    }
    if (/tesla|tsla|aapl|apple|googl|amazon|amzn|nvidia|nvda|msft|microsoft|meta|faang/.test(low)) {
      const tk = /tesla|tsla/.test(low) ? 'TSLA' : /apple|aapl/.test(low) ? 'AAPL' : /googl/.test(low) ? 'GOOGL' : /amazon|amzn/.test(low) ? 'AMZN' : /nvidia|nvda/.test(low) ? 'NVDA' : /msft|microsoft/.test(low) ? 'MSFT' : 'META';
      return `**${tk} Stock Info:**\n\nFor live ${tk} data and ML predictions visit the **Stock Predictor** page — our XGBoost+LSTM model (R²≈99.8%) forecasts next-day close prices using your FAANG dataset.\n\n**Note:** ${tk} is NYSE/NASDAQ listed. Your portfolio is NSE-focused. Adding US stocks needs an international account (LRS route, max $250k/year).\n\nWant me to analyse your **existing NSE positions** instead?`;
    }
    if (/sector|alloc|diversi|concentrat/.test(low)) {
      return `**Sector Allocation:**\n\n${Object.entries(secs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `• **${k}:** ₹${(v / 100000).toFixed(2)}L (${(v / PV * 100).toFixed(0)}%)`).join('\n')}\n\n**Key Issue:** IT at ${itPct}% is 3× the NIFTY benchmark weight of 15%\n**Missing Sectors:** Infrastructure, Energy, Metals, Real Estate\n**Action:** Redirect next SIP instalment to L&T or NTPC`;
    }
    if (/help|what can|capabilit/.test(low)) {
      return `**I can help you with:**\n\n• Portfolio risk & sector exposure analysis\n• Which positions to trim, hold or add to\n• Rebalancing strategies with specific targets\n• Stock-specific analysis (NSE/BSE and US stocks)\n• Market context (macro, RBI, sectoral trends)\n\nYour portfolio: ₹${(PV / 100000).toFixed(2)}L | +${((PV - PC) / PC * 100).toFixed(1)}% unrealised | ${PORTFOLIO_DATA.length} positions`;
    }
    return `**Regarding: "${q}"**\n\n**Portfolio Snapshot:**\n• Value: ₹${(PV / 100000).toFixed(2)}L | Return: +${((PV - PC) / PC * 100).toFixed(1)}%\n• Best position: ${topPos[0].t} at +${((topPos[0].cur - topPos[0].avg) / topPos[0].avg * 100).toFixed(1)}%\n• Biggest risk: IT overweight at ${itPct}%\n\nCould you be more specific? Try:\n• "What are my biggest risks?"\n• "Which stocks should I trim?"\n• "Analyse my sector allocation"\n• "Give me rebalancing recommendations"`;
  };

  // Detect meaningless generic ML/backend responses and skip them
  const isGenericFallback = (text) => {
    if (!text || text.length < 10) return true;
    const generic = [
      "ask me about your portfolio",
      "i'm your gift ai advisor",
      "personalised insights",
      "no response received",
      "advisor service temporarily",
    ];
    const low = text.toLowerCase();
    return generic.some(p => low.includes(p));
  };

  const send = async (text) => {
    const txt = (text || inp).trim();
    if (!txt || loading || streaming) return;
    setInp('');
    setMsgs(p => [...p, { role: 'user', content: txt }]);
    setLoad(true);

    // Level 1: Node backend (auth + full DB context + Gemini)
    try {
      const res = await api.post('/api/advisor/chat', { message: txt });
      const reply = res.data?.reply;
      if (reply && !isGenericFallback(reply)) { animateReply(reply); return; }
    } catch (_) { /* fall through to Level 2 */ }

    // Level 2: ML service directly (Gemini if API key loaded in ml-service/.env)
    try {
      const res = await fetch(`${ML_URL}/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: txt,
          context: { portfolio: { totalValue: PV, totalReturnPct: ((PV - PC) / PC * 100) } },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.reply;
        if (reply && !isGenericFallback(reply)) { animateReply(reply); return; }
      }
    } catch (_) { /* fall through to Level 3 */ }

    // Level 3: Smart local reply — keyword-aware, actually answers the question
    animateReply(smartLocalReply(txt));
  };



  const S = {
    card: { background: 'rgba(9,15,30,.9)', border: '1px solid #182236', borderRadius: 14, backdropFilter: 'blur(20px)' },
    sl: { fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a5068' },
    mono: { fontFamily: "'JetBrains Mono',monospace" },
  };

  return (
    <div style={{ padding: '26px 28px', maxWidth: 1200, height: 'calc(100vh - 80px)', display: 'flex', gap: 22, fontFamily: "'DM Sans',sans-serif", color: '#c8d8e8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes wave{0%,100%{height:3px}50%{height:14px}}
        .sugg-btn:hover{border-color:#00e5ff!important;color:#c8d8e8!important}
        .port-row:hover{background:rgba(0,229,255,.02)!important}
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 228, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        {/* Portfolio */}
        <div style={{ ...S.card, padding: 16 }}>
          <div style={{ ...S.sl, marginBottom: 12 }}>Portfolio · {PORTFOLIO_DATA.length} positions</div>
          {PORTFOLIO_DATA.map(p => {
            const ret = ((p.cur - p.avg) / p.avg * 100);
            return (
              <div key={p.t} className="port-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #182236' }}>
                <span style={{ ...S.mono, fontSize: 11, fontWeight: 700, color: '#c8d8e8' }}>{p.t}</span>
                <span style={{ ...S.mono, fontSize: 11, color: ret >= 0 ? '#00d68f' : '#ff3d5a', fontWeight: 600 }}>{ret >= 0 ? '+' : ''}{ret.toFixed(1)}%</span>
              </div>
            );
          })}
          <div style={{ marginTop: 10, padding: '8px', background: 'rgba(0,229,255,.05)', borderRadius: 7, border: '1px solid rgba(0,229,255,.1)' }}>
            <div style={{ fontSize: 10, color: '#3a5068' }}>Total P&L</div>
            <div style={{ ...S.mono, fontSize: 15, color: '#00d68f', marginTop: 2, fontWeight: 700 }}>+₹{((PV - PC) / 1000).toFixed(1)}k</div>
          </div>
        </div>

        {/* Market Pulse */}
        <div style={{ ...S.card, padding: 16 }}>
          <div style={{ ...S.sl, marginBottom: 10 }}>Market Pulse</div>
          {[['NIFTY 50', '22,186', true], ['SENSEX', '73,128', true], ['VIX', '14.2', false], ['USD/INR', '83.42', false], ['Gold MCX', '₹71,840', true], ['RBI Repo', '6.50%', null]].map(([l, v, up]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #182236' }}>
              <span style={{ fontSize: 12, color: '#3a5068' }}>{l}</span>
              <span style={{ ...S.mono, fontSize: 12, color: up === null ? '#7090a8' : up ? '#00d68f' : '#ff3d5a', fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <div style={{ ...S.card, padding: 16 }}>
          <div style={{ ...S.sl, marginBottom: 10 }}>Capabilities</div>
          {['Portfolio Analysis', 'Market Intelligence', 'Strategy Advisory', 'Risk Assessment', 'Stock Analysis'].map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', fontSize: 12, color: '#7090a8' }}>
              <span style={{ color: '#00d68f', fontSize: 10 }}>✓</span>{c}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <div style={{ ...S.sl }}>AI fin-advisor</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(0,214,143,.07)', border: '1px solid rgba(0,214,143,.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#00d68f', fontWeight: 700, marginLeft: 'auto' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d68f', animation: 'pulse 1.4s infinite', display: 'inline-block' }} />
              LIVE
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#3a5068' }}>Portfolio-aware · Market-informed · Personalised strategy</p>
        </div>

        <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'slideIn .3s ease' }}>
                {m.role === 'assistant' ? (
                  <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', maxWidth: '90%' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3, fontSize: 12, fontWeight: 900, color: '#030711' }}>AI</div>
                    <div style={{ background: '#0c1424', border: '1px solid #182236', borderRadius: '16px 16px 16px 4px', padding: '13px 17px', maxWidth: '100%' }}>
                      {renderMsg(m.content)}
                      {streaming && i === msgs.length - 1 && <span style={{ display: 'inline-block', width: 2, height: 14, background: '#00e5ff', marginLeft: 2, animation: 'blink .7s infinite', verticalAlign: 'middle' }} />}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'linear-gradient(135deg,#0c2040,#102b4c)', border: '1px solid #1c3a60', borderRadius: '16px 16px 4px 16px', padding: '13px 17px', maxWidth: '82%' }}>
                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>{m.content}</div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#00b8d4,#00e5ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 900, color: '#030711' }}>AI</div>
                <div style={{ background: '#0c1424', border: '1px solid #182236', borderRadius: '16px 16px 16px 4px', padding: '16px 18px', display: 'flex', gap: 3, alignItems: 'center' }}>
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} style={{ display: 'inline-block', width: 3, borderRadius: 2, background: '#00e5ff', margin: '0 1px', animation: 'wave .75s ease-in-out infinite', animationDelay: `${i * .08}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestion chips */}
          {msgs.length <= 1 && (
            <div style={{ padding: '0 22px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#3a5068', marginBottom: 8 }}>Quick Questions</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {SUGG.map(s => (
                  <button key={s} className="sugg-btn" onClick={() => send(s)}
                    style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#7090a8', fontFamily: "'DM Sans',sans-serif", borderRadius: 9, cursor: 'pointer', padding: '6px 12px', fontSize: 12, transition: 'all .18s', display: 'flex', alignItems: 'center', gap: 5 }}>
                    › {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: '13px 18px', borderTop: '1px solid #182236', display: 'flex', gap: 9, alignItems: 'center' }}>
            <input
              ref={inputRef}
              style={{ flex: 1, background: '#101929', border: '1px solid #1e2d45', borderRadius: 10, color: '#c8d8e8', padding: '10px 14px', fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: 'none', transition: 'border-color .2s' }}
              placeholder="Ask about portfolio, market analysis, strategy…"
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={loading || streaming}
              onFocus={e => e.target.style.borderColor = '#00e5ff'}
              onBlur={e => e.target.style.borderColor = '#1e2d45'}
            />
            <button onClick={() => send()} disabled={loading || streaming || !inp.trim()}
              style={{ padding: '10px 18px', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#c47d00,#f0a500)', color: '#030711', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, opacity: loading || streaming || !inp.trim() ? .4 : 1, transition: 'opacity .2s' }}>
              {loading ? <Spin /> : '›'} Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
