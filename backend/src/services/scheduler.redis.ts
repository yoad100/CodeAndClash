import redis from './redis.client';

const SCHEDULE_KEY = 'scheduler:jobs';

export const scheduleJob = async (matchId: string, questionIndex: number, runAtMs: number, eventType: string = 'questionTick', extraData?: any) => {
  const id = `${matchId}:${questionIndex}:${runAtMs}:${eventType}`;
  const jobData = { id, matchId, questionIndex, runAtMs, eventType, ...extraData };
  await redis.zadd(SCHEDULE_KEY, runAtMs.toString(), JSON.stringify(jobData));
};

export const cancelJobs = async (matchId: string, questionIndex: number, eventType?: string) => {
  // Get all jobs for this match and question
  const allJobs = await redis.zrange(SCHEDULE_KEY, 0, -1);
  const jobsToRemove = [];
  
  for (const jobStr of allJobs) {
    try {
      const job = JSON.parse(jobStr);
      if (job.matchId === matchId && job.questionIndex === questionIndex) {
        if (!eventType || job.eventType === eventType) {
          jobsToRemove.push(jobStr);
        }
      }
    } catch (e) {
      // Skip invalid job data
    }
  }
  
  // Remove the jobs
  if (jobsToRemove.length > 0) {
    await redis.zrem(SCHEDULE_KEY, ...jobsToRemove);
  }
};

export const fetchDueJobs = async (nowMs: number, limit = 100) => {
  const items = await redis.zrangebyscore(SCHEDULE_KEY, 0, nowMs, 'LIMIT', 0, limit);
  if (!items || items.length === 0) return [];
  const jobs = items.map((i: string) => JSON.parse(i));
  // remove fetched
  await redis.zremrangebyscore(SCHEDULE_KEY, 0, nowMs);
  return jobs;
};
