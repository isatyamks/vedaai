import './config/env';

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { initQueue, redisConnection } from './config/queue';
import { initWorker } from './workers/generationWorker';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import assignmentRoutes from './routes/assignmentRoutes';

const app = express();

const rawOrigin = process.env.FRONTEND_URL?.trim();
const origin = rawOrigin?.endsWith('/') ? rawOrigin.slice(0, -1) : (rawOrigin ?? '*');

app.use(cors({ origin }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use(rateLimiter);

app.use(async (_req, _res, next) => {
  try { await connectDB(); next(); } catch (err) { next(err); }
});

app.use('/api/assignments', assignmentRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime(), ts: new Date() }));
app.use(errorHandler);

if (!process.env.VERCEL) {
  const http = require('http');
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT ?? 5000);
  const { initSocket } = require('./services/socketService');

  async function start() {
    await connectDB();
    await initQueue();
    initSocket(server);
    initWorker();
    server.listen(PORT, () =>
      console.log(JSON.stringify({ ts: new Date().toISOString(), event: 'server_start', port: PORT }))
    );
  }

  async function shutdown(signal: string) {
    await new Promise<void>((r) => server.close(() => r()));
    if (redisConnection) await redisConnection.quit();
    await mongoose.connection.close();
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => { console.error(err.message); process.exit(1); });
  start().catch((err) => { console.error(err.message); process.exit(1); });
}

export default app;
