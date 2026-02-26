#pragma once

#include <vector>

// ── Statistical helpers ────────────────────────────────────────────────────────

/** Arithmetic mean of a vector. Returns 0 for empty input. */
double mean(const std::vector<double>& v);

/** Population standard deviation. Returns 0 for empty or single-element input. */
double stddev(const std::vector<double>& v);

/** Pearson correlation coefficient. Returns 0 if either stddev is zero. */
double correlation(const std::vector<double>& a, const std::vector<double>& b);

// ── Simulation ─────────────────────────────────────────────────────────────────

/**
 * monteCarloSimulation
 *
 * Geometric Brownian Motion simulation:
 *   S(t+1) = S(t) * exp( (mu - 0.5*sigma²)*dt + sigma*sqrt(dt)*Z ),  Z ~ N(0,1)
 *
 * @param currentPrice  Starting price (S₀).
 * @param mu            Expected annual drift (e.g. 0.07 for 7 %).
 * @param sigma         Annual volatility (e.g. 0.20 for 20 %).
 * @param days          Number of trading days to simulate.
 * @param simulations   Number of independent Monte-Carlo paths.
 * @return              Vector of final prices — one per simulation path.
 */
std::vector<double> monteCarloSimulation(double currentPrice,
                                         double mu,
                                         double sigma,
                                         int    days,
                                         int    simulations);
