/**
 * Portfolio.jsx — forwards to the live backend-connected PortfolioAnalyzer.
 *
 * PortfolioAnalyzer.jsx is the canonical implementation:
 *   - Integrates with the Node.js REST API (/api/portfolio)
 *   - Uses the C++ risk engine for VaR / Sharpe / Beta
 *   - Calls the Gemini AI for narrative analysis
 *
 * This re-export is retained for import compatibility only.
 */
export { default } from './PortfolioAnalyzer.jsx';

// ── retained below only for offline demo reference (not exported) ─────────────

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

// eslint-disable-next-line no-unused-vars
function _PortfolioMockReference() {
  const [loading, setLoading] = useState(false);

  // Mock data for the MVP
  const holdings = [
    { ticker: 'AAPL', allocation: 35, value: 5082.15, sharePrice: 150.25 },
    { ticker: 'MSFT', allocation: 25, value: 3630.12, sharePrice: 320.50 },
    { ticker: 'GOOGL', allocation: 20, value: 2904.10, sharePrice: 140.80 },
    { ticker: 'CASH', allocation: 20, value: 2904.13, sharePrice: 1.00 },
  ];

  const riskData = [
    { subject: 'Volatility', A: 120, fullMark: 150 },
    { subject: 'Beta', A: 98, fullMark: 150 },
    { subject: 'Liquidity', A: 86, fullMark: 150 },
    { subject: 'Diversification', A: 99, fullMark: 150 },
    { subject: 'Yield', A: 85, fullMark: 150 },
    { subject: 'Momentum', A: 65, fullMark: 150 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

  return (
    <div className="p-8 pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Portfolio <span className="text-emerald-400">Analyzer</span>
        </h1>
        <p className="text-gray-400 mt-2">Manage your assets and analyze risk exposure.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Holdings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Current Holdings</h2>
              <button className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                + Add Asset
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                    <th className="pb-3 font-medium">Asset</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Value</th>
                    <th className="pb-3 font-medium text-right">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {holdings.map((h, i) => (
                    <tr key={h.ticker} className="hover:bg-gray-800/20 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${COLORS[i]}20`, color: COLORS[i] }}>
                            {h.ticker[0]}
                          </div>
                          <span className="font-bold">{h.ticker}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-300">${h.sharePrice.toFixed(2)}</td>
                      <td className="py-4 font-medium">${h.value.toFixed(2)}</td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-gray-400 text-sm w-10">{h.allocation}%</span>
                          <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${h.allocation}%`, backgroundColor: COLORS[i] }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Risk Profile Analysis</h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Based on our high-performance C++ risk engine, your portfolio exhibits a <strong className="text-emerald-400">Moderate</strong> risk profile. Your diversification score is high due to the cash position, but your tech weighting increases overall volatility.
            </p>
            <div className="grid grid-cols-3 gap-4">
               {['Sharpe Ratio: 1.42', 'Beta: 1.15', 'Max Drawdown: -14%'].map((metric, i) => (
                 <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
                   <p className="font-mono text-sm text-gray-300">{metric}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Right Column - Charts */}
        <div className="space-y-8">
          {/* Allocation Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
             <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Asset Allocation</h2>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={holdings}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="allocation"
                     stroke="none"
                   >
                     {holdings.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                     itemStyle={{ color: '#fff' }}
                     formatter={(value) => `${value}%`}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="flex justify-center flex-wrap gap-4 mt-2">
                {holdings.map((h, i) => (
                  <div key={h.ticker} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {h.ticker}
                  </div>
                ))}
             </div>
          </div>

          {/* Risk Radar Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
             <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Risk Exposure</h2>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Radar name="Portfolio" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
