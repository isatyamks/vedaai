import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export let redisAvailable = false;
export let redisConnection: IORedis | null = null;
export let assessmentQueue: Queue | null = null;

const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

export async function initQueue(): Promise<void> {
  try {
    const conn = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 4000,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    await conn.connect();
    await conn.ping();

    redisConnection = conn;
    redisAvailable = true;

    assessmentQueue = new Queue('assessment-generation', {
      connection: conn as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  } catch {
    redisAvailable = false;
    redisConnection = null;
    assessmentQueue = null;
  }
}
