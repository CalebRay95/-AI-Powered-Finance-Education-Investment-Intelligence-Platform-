#include "backtester.h"

#include <algorithm>
#include <numeric>
#include <stdexcept>

// ── SMA helper ─────────────────────────────────────────────────────────────────

static std::vector<double> sma(const std::vector<double>& prices, int window) {
    std::vector<double> result(prices.size(), 0.0);
    if (window <= 0 || static_cast<int>(prices.size()) < window) return result;

    double sum = 0.0;
    for (int i = 0; i < window; ++i) sum += prices[i];
    result[window - 1] = sum / window;

    for (std::size_t i = window; i < prices.size(); ++i) {
        sum += prices[i] - prices[i - window];
        result[i] = sum / window;
    }
    return result;
}

// ── Backtest ───────────────────────────────────────────────────────────────────

BacktestResult backtest(const std::vector<double>& prices,
                        int shortWindow,
                        int longWindow) {
    BacktestResult res{0.0, 0.0, 0.0, 0};

    if (prices.size() < static_cast<std::size_t>(longWindow) + 1 ||
        shortWindow >= longWindow || shortWindow <= 0) {
        return res;
    }

    auto shortSMA = sma(prices, shortWindow);
    auto longSMA  = sma(prices, longWindow);

    // ── Simulate positions ─────────────────────────────────────────────────────
    double equity       = 1.0;   // normalised starting equity
    double peakEquity   = 1.0;
    double maxDD        = 0.0;
    int    winTrades    = 0;
    int    totalTrades  = 0;
    bool   inPosition   = false;
    double entryPrice   = 0.0;

    // Start after both SMAs are valid
    std::size_t start = static_cast<std::size_t>(longWindow);

    for (std::size_t i = start; i < prices.size(); ++i) {
        bool prevShortAbove = (i > start) && (shortSMA[i - 1] > longSMA[i - 1]);
        bool currShortAbove =                 shortSMA[i]     > longSMA[i];

        // Buy signal: short SMA crosses above long SMA
        if (!inPosition && !prevShortAbove && currShortAbove) {
            inPosition = true;
            entryPrice = prices[i];
        }
        // Sell signal: short SMA crosses below long SMA
        else if (inPosition && prevShortAbove && !currShortAbove) {
            double tradeReturn = (prices[i] - entryPrice) / entryPrice;
            equity *= (1.0 + tradeReturn);
            if (tradeReturn > 0.0) ++winTrades;
            ++totalTrades;
            inPosition = false;

            // Update max drawdown
            if (equity > peakEquity) peakEquity = equity;
            double dd = (peakEquity - equity) / peakEquity;
            if (dd > maxDD) maxDD = dd;
        }
    }

    // Close any open position at last price
    if (inPosition) {
        double tradeReturn = (prices.back() - entryPrice) / entryPrice;
        equity *= (1.0 + tradeReturn);
        if (tradeReturn > 0.0) ++winTrades;
        ++totalTrades;
        if (equity > peakEquity) peakEquity = equity;
        double dd = (peakEquity - equity) / peakEquity;
        if (dd > maxDD) maxDD = dd;
    }

    res.totalReturn  = equity - 1.0;
    res.maxDrawdown  = maxDD;
    res.winRate      = (totalTrades > 0)
                           ? static_cast<double>(winTrades) / totalTrades
                           : 0.0;
    res.totalTrades  = totalTrades;
    return res;
}
