import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Exported state — checked by routes and worker
export let redisAvailable = false;
export let redisConnection: IORedis | null = null;
export let assessmentQueue: Queue | null = null;

/**
 * Attempt to connect to Redis and initialize BullMQ.
 * Gracefully degrades if Redis is unavailable — the app still works
 * but processes jobs synchronously instead of via the background queue.
 */
export const initQueue = async (): Promise<void> => {
  try {
    const conn = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      connectTimeout: 4000,
      lazyConnect: true,
      retryStrategy: () => null, // No retries during startup probe
    });

    await conn.connect();
    await conn.ping(); // Verify the connection is alive

    redisConnection = conn;
    redisAvailable = true;

    assessmentQueue = new Queue('assessment-generation', {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    console.log('[Queue] ✅ Redis connected. BullMQ queue initialized.');
  } catch (err: any) {
    console.warn(
      `[Queue] ⚠️  Redis unavailable (${err.message}). Running in SYNC fallback mode — jobs will be processed inline without a queue.`
    );
    redisAvailable = false;
    redisConnection = null;
    assessmentQueue = null;
  }
};
