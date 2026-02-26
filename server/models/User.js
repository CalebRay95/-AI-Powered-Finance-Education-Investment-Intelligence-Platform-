import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    walletAddress: { type: String, unique: true, sparse: true, lowercase: true },
    nonce: { type: String },

    // Profile fields
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 300 },
    age: { type: Number, default: null },
    phone: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', ''], default: '' },
    handle: { type: String, default: '', trim: true },
    theme: { type: String, default: 'dark' },
    socials: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
    },

    // Login history (last 20 logins)
    loginHistory: {
      type: [{
        ip: { type: String, default: '' },
        userAgent: { type: String, default: '' },
        at: { type: Date, default: Date.now },
      }],
      default: [],
    },

    // Search history (last 50 searches)
    searchHistory: {
      type: [{ query: String, at: { type: Date, default: Date.now } }],
      default: [],
    },

    learningProgress: {
      type: [new mongoose.Schema({
        courseId: { type: String, required: true },
        completedLessons: { type: [String], default: [] },
        quizScore: { type: Number, default: null },
        quizCompleted: { type: Boolean, default: false },
        lastAccessed: { type: Date, default: null },
      }, { _id: false })],
      default: [],
    },
    predictionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' }],
  },
  { timestamps: true },
);

userSchema.pre('save', function (next) {
  if (this.walletAddress && !this.nonce) {
    this.nonce = crypto.randomBytes(32).toString('hex');
  }
  next();
});

userSchema.methods.matchPassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
