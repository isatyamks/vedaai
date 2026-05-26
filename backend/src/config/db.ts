import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vedaai';
    console.log(`[Database] Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('[Database] MongoDB connected successfully.');
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    process.exit(1);
  }
};
