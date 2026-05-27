import { Request, Response, NextFunction } from 'express';

const windowMs = 60_000;
const max = 120;
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (record.count >= max) {
    res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
    return;
  }

  record.count++;
  next();
}
