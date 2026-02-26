#pragma once

#include <vector>

/**
 * calculateVaR
 *
 * Historical-simulation Value-at-Risk.
 * Computes daily returns from the price series, sorts the losses, and returns
 * the loss magnitude at the (1 - confidenceLevel) percentile.
 *
 * @param prices           Chronological closing prices.
 * @param confidenceLevel  e.g. 0.95 for 95 % VaR.
 * @return                 Positive number representing the loss magnitude.
 */
double calculateVaR(const std::vector<double>& prices, double confidenceLevel);

/**
 * calculateSharpeRatio
 *
 * Annualised Sharpe ratio:  (mean(returns) - riskFreeRate) / stddev(returns) * sqrt(252)
 *
 * @param returns       Per-period (daily) returns.
 * @param riskFreeRate  Daily risk-free rate (e.g. 0.0001 ≈ 2.5 % / 252).
 * @return              Annualised Sharpe ratio. Returns 0 when stddev is zero.
 */
double calculateSharpeRatio(const std::vector<double>& returns, double riskFreeRate);

/**
 * calculateBeta
 *
 * Market beta:  cov(asset, market) / var(market)
 *
 * @param assetReturns   Per-period returns of the asset.
 * @param marketReturns  Per-period returns of the benchmark (e.g. S&P 500).
 * @return               Beta coefficient. Returns 0 when market variance is zero.
 */
double calculateBeta(const std::vector<double>& assetReturns,
                     const std::vector<double>& marketReturns);
