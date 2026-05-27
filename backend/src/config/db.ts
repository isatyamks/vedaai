import mongoose from 'mongoose';
import { env } from './env';

let connecting: Promise<void> | null = null;

export function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return Promise.resolve();
  if (connecting) return connecting;
  connecting = mongoose
    .connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 })
    .then(() => { connecting = null; })
    .catch((err) => { connecting = null; throw err; });
  return connecting;
}
