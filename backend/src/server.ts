import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { initQueue, redisConnection } from './config/queue';
import { initSocket } from './services/socketService';
import { initWorker } from './workers/generationWorker';
import assignmentRoutes from './routes/assignmentRoutes';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT ?? 5000);

app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/assignments', assignmentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

async function start(): Promise<void> {
  await connectDB();
  await initQueue();
  initSocket(server);
  initWorker();

  server.listen(PORT, () => {
    console.log(`Veda AI backend → http://localhost:${PORT}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received — shutting down gracefully.`);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (redisConnection) await redisConnection.quit();
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
