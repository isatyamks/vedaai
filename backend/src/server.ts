import './config/env';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initQueue, redisConnection } from './config/queue';
import { initWorker } from './workers/generationWorker';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import assignmentRoutes from './routes/assignmentRoutes';

const app = express();

const rawOrigin = env.FRONTEND_URL.trim();
const origin = rawOrigin.endsWith('/') ? rawOrigin.slice(0, -1) : rawOrigin;

// Allow Private Network Access (PNA) preflight requests
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

app.use(cors({ origin }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(rateLimiter);

app.use('/api/assignments', assignmentRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), ts: new Date() }));
app.use(errorHandler);

if (!env.VERCEL) {
  const http = require('http');
  const server = http.createServer(app);
  const { initSocket } = require('./services/socketService');

  async function start() {
    await connectDB();
    await initQueue();
    initSocket(server);
    initWorker();
    server.listen(env.PORT, () =>
      console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'server_start', port: env.PORT }))
    );
  }

  async function shutdown() {
    await new Promise<void>((r) => server.close(() => r()));
    if (redisConnection) await redisConnection.quit();
    await mongoose.connection.close();
    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('uncaughtException', (err) => { console.error(err.message); process.exit(1); });
  start().catch((err) => { console.error(err.message); process.exit(1); });
} else {
  // Vercel: connect lazily on first request via connectDB() idempotency guard
  app.use(async (_req, _res, next) => {
    try { await connectDB(); next(); } catch (err) { next(err); }
  });
}

export default app;
