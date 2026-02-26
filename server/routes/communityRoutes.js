/**
 * communityRoutes.js
 *
 * GET /api/community/messages/:room
 *   Returns the last 100 messages for the given room, sorted by timestamp ascending.
 */

import express from 'express';
import Message from '../models/Message.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/messages/:room', protect, async (req, res) => {
  const { room } = req.params;

  const VALID_ROOMS = ['general', 'options-trading', 'crypto-analysis', 'dividend-investing'];
  if (!VALID_ROOMS.includes(room)) {
    return res.status(400).json({ message: 'Invalid room.' });
  }

  const messages = await Message.find({ room })
    .sort({ timestamp: 1 })
    .limit(100)
    .lean();

  res.json(messages);
});

export default router;
