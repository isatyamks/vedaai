import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  GEMINI_API_KEY: z.string().optional(),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  FRONTEND_URL: z.string().default('*'),
  VERCEL: z.string().optional(),
});

function validateEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }
  return result.data;
}

export const env = validateEnv();
