#include "quant_math.h"

#include <cmath>
#include <numeric>
#include <random>
#include <stdexcept>

// ── Statistical helpers ────────────────────────────────────────────────────────

double mean(const std::vector<double>& v) {
    if (v.empty()) return 0.0;
    return std::accumulate(v.begin(), v.end(), 0.0) / static_cast<double>(v.size());
}

double stddev(const std::vector<double>& v) {
    if (v.size() < 2) return 0.0;
    double m = mean(v);
    double acc = 0.0;
    for (double x : v) acc += (x - m) * (x - m);
    return std::sqrt(acc / static_cast<double>(v.size())); // population stddev
}

double correlation(const std::vector<double>& a, const std::vector<double>& b) {
    std::size_t n = std::min(a.size(), b.size());
    if (n < 2) return 0.0;

    double ma = mean(std::vector<double>(a.begin(), a.begin() + n));
    double mb = mean(std::vector<double>(b.begin(), b.begin() + n));
    double sa = stddev(std::vector<double>(a.begin(), a.begin() + n));
    double sb = stddev(std::vector<double>(b.begin(), b.begin() + n));

    if (sa == 0.0 || sb == 0.0) return 0.0;

    double cov = 0.0;
    for (std::size_t i = 0; i < n; ++i) {
        cov += (a[i] - ma) * (b[i] - mb);
    }
    cov /= static_cast<double>(n);
    return cov / (sa * sb);
}

// ── Monte-Carlo Simulation ─────────────────────────────────────────────────────

std::vector<double> monteCarloSimulation(double currentPrice,
                                          double mu,
                                          double sigma,
                                          int    days,
                                          int    simulations) {
    if (days <= 0 || simulations <= 0 || currentPrice <= 0.0) {
        return std::vector<double>(simulations, currentPrice);
    }

    const double dt = 1.0 / 252.0; // one trading day as fraction of year
    const double drift    = (mu - 0.5 * sigma * sigma) * dt;
    const double diffusion = sigma * std::sqrt(dt);

    std::mt19937 rng(std::random_device{}());
    std::normal_distribution<double> norm(0.0, 1.0);

    std::vector<double> finalPrices;
    finalPrices.reserve(simulations);

    for (int s = 0; s < simulations; ++s) {
        double price = currentPrice;
        for (int d = 0; d < days; ++d) {
            price *= std::exp(drift + diffusion * norm(rng));
        }
        finalPrices.push_back(price);
    }

    return finalPrices;
}
