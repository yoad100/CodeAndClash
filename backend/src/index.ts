import dotenv from 'dotenv';
dotenv.config();
import logger from './logger';
// Helpful startup log to show whether REDIS_URL is configured
if (process.env.REDIS_URL) {
  logger.info('REDIS_URL is set — connecting to Redis at %s', process.env.REDIS_URL);
} else {
  logger.info('REDIS_URL not set — Redis features will be disabled (noop)');
}

import { createServer } from 'http';
import { app } from './app';
import { initSocket } from './socket';
import { connectDB, disconnectDB } from './db';

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();

  const server = createServer(app);
  const socketServer = initSocket(server);

  server.listen(PORT, () => {
    logger.info(`Backend running on port ${PORT}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down...');
    try {
      server.close();
    } catch (e) {}
    try {
      if (socketServer && typeof socketServer.cleanup === 'function') await socketServer.cleanup();
    } catch (e) {}
    try { await disconnectDB(); } catch (e) {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
