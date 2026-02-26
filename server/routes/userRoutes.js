import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/user/profile — return full profile
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id).select('-passwordHash -nonce').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
});

// PATCH /api/user/profile — update profile fields
router.patch('/profile', protect, async (req, res) => {
    const ALLOWED = ['name', 'bio', 'age', 'phone', 'gender', 'handle', 'theme', 'avatar', 'socials'];
    const updates = {};
    for (const key of ALLOWED) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Handle email change
    if (req.body.email && req.body.email !== req.user.email) {
        const exists = await User.findOne({ email: req.body.email.toLowerCase().trim() });
        if (exists) return res.status(400).json({ message: 'Email already in use.' });
        updates.email = req.body.email.toLowerCase().trim();
    }

    // Handle password change
    if (req.body.newPassword) {
        if (!req.body.currentPassword) return res.status(400).json({ message: 'Current password required.' });
        const user = await User.findById(req.user._id);
        const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash || '');
        if (!valid) return res.status(401).json({ message: 'Current password is incorrect.' });
        updates.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
    }

    const updated = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true },
    ).select('-passwordHash -nonce').lean();

    res.json(updated);
});

// POST /api/user/search-history — add a search
router.post('/search-history', protect, async (req, res) => {
    const { query } = req.body;
    if (!query?.trim()) return res.status(400).json({ message: 'query required' });
    await User.findByIdAndUpdate(req.user._id, {
        $push: { searchHistory: { $each: [{ query: query.trim(), at: new Date() }], $slice: -50 } },
    });
    res.json({ ok: true });
});

// DELETE /api/user/search-history — clear search history
router.delete('/search-history', protect, async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { searchHistory: [] } });
    res.json({ ok: true });
});

// DELETE /api/user/login-history — clear login history
router.delete('/login-history', protect, async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $set: { loginHistory: [] } });
    res.json({ ok: true });
});

export default router;
