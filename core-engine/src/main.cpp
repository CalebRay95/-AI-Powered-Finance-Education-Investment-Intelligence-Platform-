/**
 * GIFT Core Engine — JSON Command Router
 *
 * Reads a single JSON object from stdin:
 *   { "command": "<cmd>", "payload": { ... } }
 *
 * Writes a JSON result to stdout:
 *   { "status": "ok",    "result": <value>   }
 *   { "status": "error", "message": "<text>" }
 *
 * Supported commands:
 *   var          → calculateVaR(prices[], confidence)
 *   sharpe       → calculateSharpeRatio(returns[], riskFreeRate)
 *   beta         → calculateBeta(assetReturns[], marketReturns[])
 *   montecarlo   → monteCarloSimulation(currentPrice, mu, sigma, days, simulations)
 *   backtest     → backtest(prices[], shortWindow, longWindow)
 */

#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

#include <nlohmann/json.hpp>

#include "risk_engine.h"
#include "quant_math.h"
#include "backtester.h"

using json = nlohmann::json;

static json handleCommand(const std::string& command, const json& payload) {
    if (command == "var") {
        auto prices     = payload.at("prices").get<std::vector<double>>();
        double conf     = payload.at("confidence").get<double>();
        return calculateVaR(prices, conf);
    }
    if (command == "sharpe") {
        auto rets       = payload.at("returns").get<std::vector<double>>();
        double rfr      = payload.at("riskFreeRate").get<double>();
        return calculateSharpeRatio(rets, rfr);
    }
    if (command == "beta") {
        auto asset      = payload.at("assetReturns").get<std::vector<double>>();
        auto market     = payload.at("marketReturns").get<std::vector<double>>();
        return calculateBeta(asset, market);
    }
    if (command == "montecarlo") {
        double price    = payload.at("currentPrice").get<double>();
        double mu       = payload.at("mu").get<double>();
        double sigma    = payload.at("sigma").get<double>();
        int    days     = payload.at("days").get<int>();
        int    sims     = payload.at("simulations").get<int>();
        return monteCarloSimulation(price, mu, sigma, days, sims);
    }
    if (command == "backtest") {
        auto prices     = payload.at("prices").get<std::vector<double>>();
        int  shortWin   = payload.at("shortWindow").get<int>();
        int  longWin    = payload.at("longWindow").get<int>();
        auto r          = backtest(prices, shortWin, longWin);
        return json{
            {"totalReturn",  r.totalReturn},
            {"maxDrawdown",  r.maxDrawdown},
            {"winRate",      r.winRate},
            {"totalTrades",  r.totalTrades},
        };
    }
    throw std::invalid_argument("Unknown command: " + command);
}

int main() {
    try {
        json input;
        std::cin >> input;

        const std::string command = input.at("command").get<std::string>();
        const json&       payload = input.at("payload");

        json result = handleCommand(command, payload);
        std::cout << json{{"status", "ok"}, {"result", result}}.dump() << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cout << json{{"status", "error"}, {"message", e.what()}}.dump() << std::endl;
        return 1;
    }
}
