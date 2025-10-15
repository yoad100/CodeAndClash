import dotenv from 'dotenv';
dotenv.config();
import redis from './services/redis.client';
import { fetchDueJobs } from './services/scheduler.redis';
import logger from './logger';
import { connectDB, disconnectDB } from './db';
import { recalculateAllUserLevels } from './services/level.service';
import compactOldMatches from './tools/compact-old-matches';

async function poll() {
  try {
    const now = Date.now();
    const jobs = await fetchDueJobs(now);
    for (const job of jobs) {
      const eventType = job.eventType || 'questionTick';
      const eventData: any = {
        event: 'questionTick',
        eventType,
        matchId: job.matchId,
        questionIndex: job.questionIndex
      };
      
      // Add extra data for unfreeze events
      if (eventType === 'unfreeze') {
        eventData.playerId = job.playerId;
      }
      
      await redis.publish('match-events', JSON.stringify(eventData));
      logger.debug('Published %s for %s:%s', eventType, job.matchId, job.questionIndex);
    }
  } catch (err) {
    logger.error('scheduler poll error %o', err);
  }
}

setInterval(() => {
  poll().catch((err) => logger.error('scheduler poll error %o', err));
}, 1000);

const DAY_MS = 24 * 60 * 60 * 1000;
let levelInterval: ReturnType<typeof setInterval> | null = null;

async function runLevelRefresh() {
  try {
    await recalculateAllUserLevels();
  } catch (err) {
    logger.error('Level refresh failed: %o', err);
  }
}

async function bootstrap() {
  try {
    await connectDB();
    logger.info('Scheduler worker connected to database');
  } catch (err) {
    logger.error('Scheduler worker failed to connect to database: %o', err);
  }

  // start immediately
  poll().catch((e: any) => logger.error(e));

  // kick off level refresh on boot and set daily interval
  runLevelRefresh().catch((e: any) => logger.error(e));
  levelInterval = setInterval(() => {
    runLevelRefresh().catch((e: any) => logger.error(e));
  }, DAY_MS);

  // schedule compaction job once per day (offset by 5 minutes to avoid thundering with other jobs)
  setTimeout(() => {
    // run immediately then set daily interval
    compactOldMatches().catch((e: any) => logger.error('compactOldMatches failed: %o', e));
    setInterval(() => {
      compactOldMatches().catch((e: any) => logger.error('compactOldMatches failed: %o', e));
    }, DAY_MS);
  }, 5 * 60 * 1000);
}

bootstrap().catch((err) => logger.error('Scheduler bootstrap error %o', err));

async function shutdown() {
  try {
    if (levelInterval) {
      clearInterval(levelInterval);
    }
    await disconnectDB();
  } catch (err) {
    logger.error('Scheduler shutdown error %o', err);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
