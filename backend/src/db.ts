import mongoose from 'mongoose';
import logger from './logger';

const DEFAULT_LOCAL_URI = 'mongodb://localhost:27017/codingwar';

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_LOCAL_URI;

  if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    // Fail fast in production if no Atlas URI provided
    throw new Error('Missing MONGODB_URI environment variable in production');
  }

  // Mongoose options: keep serverSelectionTimeout low for faster failure detection
  const opts = {
    serverSelectionTimeoutMS: 5000,
  } as any;

  const maxRetries = 5;
  let attempt = 0;
  while (true) {
    try {
      await mongoose.connect(uri, opts);
      logger.info('Connected to MongoDB');
      break;
    } catch (err) {
      attempt += 1;
      logger.warn(`MongoDB connection attempt ${attempt} failed`, err);
      if (attempt >= maxRetries || process.env.NODE_ENV === 'production') {
        logger.error('Could not connect to MongoDB - aborting');
        throw err;
      }
      const backoff = Math.min(1000 * 2 ** attempt, 30000);
      logger.info(`Retrying MongoDB connection in ${backoff}ms`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(backoff);
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (err) {
    logger.warn('Error disconnecting MongoDB', err);
  }
};
