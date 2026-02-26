#pragma once

#include <vector>

/** Aggregated result of a single backtest run. */
struct BacktestResult {
    double totalReturn;   ///< (finalEquity / initialEquity) - 1
    double maxDrawdown;   ///< Maximum peak-to-trough decline (positive magnitude)
    double winRate;       ///< Fraction of completed trades that were profitable
    int    totalTrades;   ///< Number of completed buy→sell round trips
};

/**
 * backtest
 *
 * Simple SMA crossover strategy:
 *   - Buy  when shortWindow SMA crosses ABOVE longWindow SMA.
 *   - Sell when shortWindow SMA crosses BELOW longWindow SMA.
 *
 * @param prices       Chronological closing prices.
 * @param shortWindow  Period for the fast (short) SMA.
 * @param longWindow   Period for the slow (long) SMA.
 * @return             BacktestResult with return, drawdown, win-rate, and trade count.
 */
BacktestResult backtest(const std::vector<double>& prices,
                        int shortWindow,
                        int longWindow);
