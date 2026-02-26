/**
 * coreEngine.js — Pure JavaScript statistics engine
 *
 * Replaces the C++ gift_core binary with native JS implementations
 * so the portfolio analytics work without any native build tools.
 *
 * Exported functions mirror the original API and return Promises.
 */

// ─── Math helpers ─────────────────────────────────────────────────────────────

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function covariance(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  return xs.slice(0, n).reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / (n - 1);
}

// ─── VaR (Historical Simulation) ─────────────────────────────────────────────

/**
 * calculateVaR(returns, confidence)
 * Returns the loss at the given confidence percentile (negative number = loss).
 * e.g. confidence 0.95 → 5th percentile of the return distribution.
 */
export function calculateVaR(returns, confidence = 0.95) {
  if (!returns || returns.length < 5) return Promise.resolve(0);
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  const varValue = sorted[Math.max(idx, 0)];
  return Promise.resolve(varValue);
}

// ─── Sharpe Ratio ─────────────────────────────────────────────────────────────

/**
 * calculateSharpeRatio(returns, riskFreeRate)
 * Annualised Sharpe = (mean_return - rf) / stddev * sqrt(252)
 */
export function calculateSharpeRatio(returns, riskFreeRate = 0.0001) {
  if (!returns || returns.length < 5) return Promise.resolve(0);
  const m = mean(returns);
  const sd = stddev(returns);
  if (sd === 0) return Promise.resolve(0);
  const sharpe = ((m - riskFreeRate) / sd) * Math.sqrt(252);
  return Promise.resolve(Math.round(sharpe * 1000) / 1000);
}

// ─── Beta ─────────────────────────────────────────────────────────────────────

/**
 * calculateBeta(assetReturns, marketReturns)
 * Beta = Cov(asset, market) / Var(market)
 */
export function calculateBeta(assetReturns, marketReturns) {
  const n = Math.min(assetReturns.length, marketReturns.length);
  if (n < 5) return Promise.resolve(1);
  const cov = covariance(assetReturns.slice(0, n), marketReturns.slice(0, n));
  const varM = stddev(marketReturns.slice(0, n)) ** 2;
  if (varM === 0) return Promise.resolve(1);
  const beta = Math.round((cov / varM) * 1000) / 1000;
  return Promise.resolve(beta);
}

// ─── Monte Carlo ──────────────────────────────────────────────────────────────

/**
 * runMonteCarlo(currentPrice, mu, sigma, days, simulations)
 * Geometric Brownian Motion. Returns array of final simulated prices.
 */
export function runMonteCarlo(currentPrice, mu, sigma, days, simulations = 1000) {
  const results = [];
  const dt = 1 / 252;
  for (let s = 0; s < simulations; s++) {
    let price = currentPrice;
    for (let d = 0; d < days; d++) {
      // Box-Muller transform for normal random
      const u1 = Math.random(), u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      price *= Math.exp((mu - 0.5 * sigma ** 2) * dt + sigma * Math.sqrt(dt) * z);
    }
    results.push(price);
  }
  return Promise.resolve(results);
}

// ─── Backtest ─────────────────────────────────────────────────────────────────

/**
 * runBacktest(prices, shortWindow, longWindow)
 * Simple SMA crossover. Returns { totalReturn, maxDrawdown, winRate, totalTrades }.
 */
export function runBacktest(prices, shortWindow = 10, longWindow = 30) {
  if (!prices || prices.length < longWindow + 1) {
    return Promise.resolve({ totalReturn: 0, maxDrawdown: 0, winRate: 0, totalTrades: 0 });
  }
  const sma = (arr, i, w) =>
    arr.slice(Math.max(0, i - w + 1), i + 1).reduce((s, v) => s + v, 0) / Math.min(i + 1, w);

  let position = 0, cash = 10000, shares = 0, trades = 0, wins = 0;
  let peak = cash, maxDrawdown = 0, buyPrice = 0;

  for (let i = longWindow; i < prices.length; i++) {
    const shortSma = sma(prices, i, shortWindow);
    const longSma = sma(prices, i, longWindow);
    const equity = cash + shares * prices[i];
    if (equity > peak) peak = equity;
    const dd = (peak - equity) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;

    if (position === 0 && shortSma > longSma) {
      shares = Math.floor(cash / prices[i]);
      cash -= shares * prices[i];
      buyPrice = prices[i];
      position = 1;
    } else if (position === 1 && shortSma < longSma) {
      cash += shares * prices[i];
      if (prices[i] > buyPrice) wins++;
      trades++;
      shares = 0;
      position = 0;
    }
  }
  if (position === 1) {
    cash += shares * prices[prices.length - 1];
    trades++;
  }
  return Promise.resolve({
    totalReturn: (cash - 10000) / 10000 * 100,
    maxDrawdown: maxDrawdown * 100,
    winRate: trades > 0 ? (wins / trades) * 100 : 0,
    totalTrades: trades,
  });
}

// ─── runCoreEngine shim (for any remaining direct callers) ───────────────────

export function runCoreEngine(command, payload) {
  switch (command) {
    case 'var': return calculateVaR(payload.prices, payload.confidence);
    case 'sharpe': return calculateSharpeRatio(payload.returns, payload.riskFreeRate);
    case 'beta': return calculateBeta(payload.assetReturns, payload.marketReturns);
    case 'montecarlo': return runMonteCarlo(payload.currentPrice, payload.mu, payload.sigma, payload.days, payload.simulations);
    case 'backtest': return runBacktest(payload.prices, payload.shortWindow, payload.longWindow);
    default: return Promise.reject(new Error(`Unknown command: ${command}`));
  }
}
