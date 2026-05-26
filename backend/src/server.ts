import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { initSocket } from './services/socketService';
import { initWorker } from './workers/generationWorker';
import assignmentRoutes from './routes/assignmentRoutes';
import { redisConnection } from './config/queue';
import mongoose from 'mongoose';

// 1. Initialize environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// 2. Set up Middleware
app.use(cors());
app.use(express.json());

// 3. Register HTTP Routes
app.use('/api/assignments', assignmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// 4. Core startup logic
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start WebSocket server
    initSocket(server);
    console.log('[WebSocket] Socket.io server bound to HTTP instance.');

    // Initialize BullMQ worker to start listening for jobs
    initWorker();

    // Listen on PORT
    server.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` VedaAI Backend Server running on port ${PORT} `);
      console.log(` URL: http://localhost:${PORT}                      `);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('[Server] Critical start failure:', error);
    process.exit(1);
  }
};

// 5. Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  
  server.close(() => {
    console.log('[Server] HTTP server closed.');
  });

  try {
    await redisConnection.quit();
    console.log('[Queue] Redis connection terminated.');

    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed.');

    console.log('[Server] Graceful shutdown completed. Exiting process.');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
