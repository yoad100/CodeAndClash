import redis from './services/redis.client';
import { fetchDueJobs } from './services/scheduler.redis';
import logger from './logger';

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

setInterval(poll, 1000);

// start immediately
poll().catch((e) => logger.error(e));
