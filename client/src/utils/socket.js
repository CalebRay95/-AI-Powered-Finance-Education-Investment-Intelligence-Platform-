/**
 * socket.js — Singleton Socket.IO client
 *
 * Call `getSocket()` to lazily create (or retrieve) the one shared socket
 * instance. Using a singleton prevents duplicate connections across re-renders
 * or hot-module replacements.
 *
 * The socket is created with `autoConnect: false` so that the caller controls
 * exactly when to connect (after the auth token is confirmed present).
 */

import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Returns the singleton socket, creating it on first call.
 * Always refreshes auth.token from localStorage before returning so a fresh
 * JWT is used after login.
 */
export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: false,
      auth: { token: localStorage.getItem('gift_token') },
    });
  } else {
    // Refresh token in case the user logged in after the first call
    socket.auth = { token: localStorage.getItem('gift_token') };
  }
  return socket;
}

/** Disconnect and destroy the singleton so the next `getSocket()` creates fresh. */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
