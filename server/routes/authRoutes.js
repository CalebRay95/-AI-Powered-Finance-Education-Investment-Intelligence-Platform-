import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ethers } from 'ethers';
import User from '../models/User.js';

const router = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  walletAddress: user.walletAddress,
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken(user);
  return res.status(201).json({ token, user: userPayload(user) });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Wallet-only users have no passwordHash — reject password login gracefully
  if (!user.passwordHash) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken(user);

  // Record login event (keep last 20)
  await User.findByIdAndUpdate(user._id, {
    $push: {
      loginHistory: {
        $each: [{ ip: req.ip || '', userAgent: req.headers['user-agent'] || '', at: new Date() }],
        $slice: -20,
      },
    },
  });

  return res.json({ token, user: userPayload(user) });
});

// ─── GET /api/auth/web3/nonce ─────────────────────────────────────────────────
// Step A: client requests the challenge nonce for a wallet address.

router.get('/web3/nonce', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ message: 'address query parameter is required' });
  }

  const lowered = address.toLowerCase();

  let user = await User.findOne({ walletAddress: lowered });

  if (!user) {
    // Create a skeleton user — name/email filled in later from profile phase
    const nonce = crypto.randomBytes(32).toString('hex');
    user = await User.create({
      name: `wallet_${lowered.slice(2, 8)}`,
      email: `${lowered}@wallet.local`,
      walletAddress: lowered,
      nonce,
    });
  } else if (!user.nonce) {
    user.nonce = crypto.randomBytes(32).toString('hex');
    await user.save();
  }

  return res.json({ nonce: user.nonce });
});

// ─── POST /api/auth/web3 ──────────────────────────────────────────────────────
// Step B: client sends signed nonce; server recovers signer and issues JWT.

router.post('/web3', async (req, res) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ message: 'address and signature are required' });
  }

  const lowered = address.toLowerCase();

  const user = await User.findOne({ walletAddress: lowered });
  if (!user) {
    return res.status(404).json({ message: 'Wallet address not registered — request nonce first' });
  }

  // Recover the signer from the signed nonce
  let recovered;
  try {
    recovered = ethers.verifyMessage(user.nonce, signature).toLowerCase();
  } catch {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  if (recovered !== lowered) {
    return res.status(401).json({ message: 'Signature does not match wallet address' });
  }

  // Refresh nonce to prevent replay attacks
  user.nonce = crypto.randomBytes(32).toString('hex');
  await user.save();

  const token = signToken(user);
  return res.json({ token, user: userPayload(user) });
});

export default router;
