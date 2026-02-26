import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
  {
    ticker:        { type: String, uppercase: true, trim: true },
    shares:        { type: Number },
    avgBuyPrice:   { type: Number },
    currentPrice:  { type: Number },
    currentValue:  { type: Number },
    weight:        { type: Number },           // % of total portfolio value
    dailyReturns:  { type: [Number], default: [] }, // 30-day return series
  },
  { _id: false },
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },

    // Holdings
    holdings: { type: [holdingSchema], default: [] },

    // Summary metrics
    totalValue:      { type: Number, default: 0 },
    totalCost:       { type: Number, default: 0 },
    totalReturnPct:  { type: Number, default: 0 },

    // Risk metrics (computed by C++ engine)
    sharpeRatio: { type: Number, default: 0 },
    var95:       { type: Number, default: 0 },
    beta:        { type: Number, default: 0 },
    riskScore:   { type: Number, default: 0, min: 0, max: 100 },

    // Monte Carlo simulation percentiles (computed by C++ engine)
    monteCarloPercentiles: {
      p5:  { type: Number },
      p50: { type: Number },
      p95: { type: Number },
    },

    // SMA crossover backtest results (computed by C++ engine)
    backtestResult: {
      totalReturn: { type: Number },
      maxDrawdown: { type: Number },
      winRate:     { type: Number },
      totalTrades: { type: Number },
    },

    // AI narrative (from Gemini via portfolio_ai router)
    aiNarrative:       { type: String, default: '' },
    allocationInsights:{ type: String, default: '' },
    recommendations:   { type: String, default: '' },

    lastAnalyzed: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model('Portfolio', portfolioSchema);
