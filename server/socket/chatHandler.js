/**
 * chatHandler.js
 *
 * Exports `initChat(io)` which wires all Socket.IO events for the community chat.
 *
 * Authentication: JWT token passed in socket.handshake.auth.token is verified
 * before any event is processed; non-authenticated connections are rejected.
 */

import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';

const VALID_ROOMS = ['general', 'options-trading', 'crypto-analysis', 'dividend-investing'];

export function initChat(io) {
  // ── JWT handshake middleware ──────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = decoded; // { id, name, email, ... }
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  // ── Connection ────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { id: userId, name: userName } = socket.data.user;

    // ── join_room ─────────────────────────────────────────────────────────
    socket.on('join_room', async (room) => {
      if (!VALID_ROOMS.includes(room)) return;

      socket.join(room);

      try {
        const history = await Message.find({ room })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean()
          .then((docs) => docs.reverse()); // return in ascending order

        socket.emit('room_history', history);

        // Broadcast updated member count to the room
        const count = io.sockets.adapter.rooms.get(room)?.size ?? 0;
        io.to(room).emit('room_count', { room, count });
      } catch (err) {
        console.error('[chatHandler] join_room error:', err);
      }
    });

    // ── send_message ──────────────────────────────────────────────────────
    socket.on('send_message', async ({ room, content, parentId } = {}) => {
      if (!VALID_ROOMS.includes(room)) return;
      if (!content || typeof content !== 'string' || !content.trim()) return;

      try {
        const msg = await Message.create({
          userId,
          userName,
          content: content.trim().slice(0, 1000),
          room,
          // Only set parentId if it is a valid-looking ObjectId string
          parentId: parentId && /^[a-f\d]{24}$/i.test(String(parentId)) ? parentId : null,
        });

        io.to(room).emit('new_message', msg.toObject());
      } catch (err) {
        console.error('[chatHandler] send_message error:', err);
      }
    });

    // ── leave_room ────────────────────────────────────────────────────────
    socket.on('leave_room', (room) => {
      socket.leave(room);

      const count = io.sockets.adapter.rooms.get(room)?.size ?? 0;
      io.to(room).emit('room_count', { room, count });
    });

    // ── disconnect: Socket.IO handles room cleanup automatically ─────────
  });
}
