import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

console.log(`[Queue] Connecting to Redis at: ${redisUrl}`);

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
});

const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// Create and export the main question generation queue
export const assessmentQueue = new Queue('assessment-generation', queueOptions);

console.log('[Queue] BullMQ assessment-generation queue initialized.');
