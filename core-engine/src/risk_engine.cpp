#include "risk_engine.h"

#include <algorithm>
#include <cmath>
#include <numeric>
#include <stdexcept>
#include <vector>

// ── Internal helpers ───────────────────────────────────────────────────────────

static std::vector<double> dailyReturns(const std::vector<double>& prices) {
    if (prices.size() < 2) return {};
    std::vector<double> rets;
    rets.reserve(prices.size() - 1);
    for (std::size_t i = 1; i < prices.size(); ++i) {
        rets.push_back((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return rets;
}

static double vecMean(const std::vector<double>& v) {
    if (v.empty()) return 0.0;
    return std::accumulate(v.begin(), v.end(), 0.0) / static_cast<double>(v.size());
}

static double vecVariance(const std::vector<double>& v) {
    if (v.size() < 2) return 0.0;
    double m = vecMean(v);
    double acc = 0.0;
    for (double x : v) acc += (x - m) * (x - m);
    return acc / static_cast<double>(v.size()); // population variance
}

// ── Public implementations ─────────────────────────────────────────────────────

double calculateVaR(const std::vector<double>& prices, double confidenceLevel) {
    auto rets = dailyReturns(prices);
    if (rets.empty()) return 0.0;

    // Convert returns to losses (negate so that losses are positive)
    std::vector<double> losses;
    losses.reserve(rets.size());
    for (double r : rets) losses.push_back(-r);

    std::sort(losses.begin(), losses.end());

    // Historical-simulation: loss at the upper-tail confidenceLevel percentile.
    // e.g. 95% VaR → index at the 95th percentile of sorted losses (worst 5%).
    std::size_t n = losses.size();
    std::size_t idx = confidenceLevel >= 1.0
                          ? n - 1
                          : static_cast<std::size_t>(std::ceil(confidenceLevel * n)) - 1;
    idx = std::min(idx, n - 1);

    return losses[idx]; // positive = loss magnitude
}

double calculateSharpeRatio(const std::vector<double>& returns, double riskFreeRate) {
    if (returns.empty()) return 0.0;

    double m = vecMean(returns);
    double sd = std::sqrt(vecVariance(returns));
    if (sd == 0.0) return 0.0;

    // Annualise: mean and stddev are daily → multiply by sqrt(252) / 1
    return ((m - riskFreeRate) / sd) * std::sqrt(252.0);
}

double calculateBeta(const std::vector<double>& assetReturns,
                     const std::vector<double>& marketReturns) {
    std::size_t n = std::min(assetReturns.size(), marketReturns.size());
    if (n < 2) return 0.0;

    double assetMean  = vecMean(std::vector<double>(assetReturns.begin(),  assetReturns.begin()  + n));
    double marketMean = vecMean(std::vector<double>(marketReturns.begin(), marketReturns.begin() + n));

    double cov = 0.0, varM = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        double da = assetReturns[i]  - assetMean;
        double dm = marketReturns[i] - marketMean;
        cov  += da * dm;
        varM += dm * dm;
    }

    if (varM == 0.0) return 0.0;
    return cov / varM;
}
