import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { initQueue, redisConnection } from './config/queue';
import { initSocket } from './services/socketService';
import { initWorker } from './workers/generationWorker';
import assignmentRoutes from './routes/assignmentRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/assignments', assignmentRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date(), uptime: process.uptime() });
});

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Try connecting to Redis (non-fatal if unavailable)
    await initQueue();

    // 3. Attach Socket.io
    initSocket(server);
    console.log('[WebSocket] Socket.io server initialized.');

    // 4. Start BullMQ worker (no-op if Redis is down)
    initWorker();

    // 5. Listen
    server.listen(PORT, () => {
      console.log(`\n=================================================`);
      console.log(` VedaAI Backend running on http://localhost:${PORT}`);
      console.log(`=================================================\n`);
    });
  } catch (error) {
    console.error('[Server] Critical startup failure:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Server] ${signal} received. Shutting down...`);
  server.close(() => console.log('[Server] HTTP server closed.'));
  try {
    if (redisConnection) {
      await redisConnection.quit();
      console.log('[Queue] Redis connection closed.');
    }
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('[Server] Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
