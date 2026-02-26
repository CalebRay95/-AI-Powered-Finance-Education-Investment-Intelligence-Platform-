import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    userPrediction: {
      type: String,
      enum: ['UP', 'DOWN'],
      required: true,
    },
    aiPrediction: {
      type: String,
      enum: ['UP', 'DOWN', 'NEUTRAL'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    actualOutcome: {
      type: String,
      enum: ['UP', 'DOWN', 'FLAT', 'PENDING'],
      default: 'PENDING',
    },
    explanation: {
      type: String,
    },
    priceChangePct: {
      type: Number,
    },
    featureImportance: {
      type: Object,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { versionKey: false },
);

export default mongoose.model('Prediction', predictionSchema);
