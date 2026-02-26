import 'dotenv/config';
import 'express-async-errors';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRouter from './routes/authRoutes.js';
import newsRouter from './routes/newsRoutes.js';
import predictionRouter from './routes/predictionRoutes.js';
import portfolioRouter from './routes/portfolioRoutes.js';
import advisorRouter from './routes/advisorRoutes.js';
import learningRouter from './routes/learningRoutes.js';
import communityRouter from './routes/communityRoutes.js';
import userRouter from './routes/userRoutes.js';
import { initChat } from './socket/chatHandler.js';

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from any localhost port (dev) OR the configured CLIENT_URL
      const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
      if (!origin || origin === allowed || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'GIFT API', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/news', newsRouter);
app.use('/api/prediction', predictionRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/learning', learningRouter);
app.use('/api/community', communityRouter);
app.use('/api/user', userRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
      if (!origin || origin === allowed || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  },
});
initChat(io);
httpServer.listen(PORT, () => {
  console.log(`GIFT API server running on port ${PORT}`);
});
