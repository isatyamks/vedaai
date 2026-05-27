import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

export let redisAvailable = false;
export let redisConnection: IORedis | null = null;
export let assessmentQueue: Queue | null = null;

export async function initQueue(): Promise<void> {
  try {
    const conn = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 4000,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    conn.on('error', () => {});

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
