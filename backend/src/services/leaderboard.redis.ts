import redis from './redis.client';

const LEADERBOARD_KEY = 'leaderboard:rating';

export const updateScore = async (userId: string, score: number) => {
  await redis.zadd(LEADERBOARD_KEY, score.toString(), userId);
};

export const getTop = async (start = 0, stop = 99) => {
  // zrevrange returns highest to lowest
  const ids = await redis.zrevrange(LEADERBOARD_KEY, start, stop, 'WITHSCORES');
  const result: Array<{ userId: string; score: number }> = [];
  for (let i = 0; i < ids.length; i += 2) {
    result.push({ userId: ids[i], score: parseFloat(ids[i + 1]) });
  }
  return result;
};

export const getRank = async (userId: string) => {
  const rank = await redis.zrevrank(LEADERBOARD_KEY, userId);
  if (rank === null) return null;
  return rank + 1;
};
