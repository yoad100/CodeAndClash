import redis from './redis.client';

const MATCH_STATE_PREFIX = 'matchstate:';

export const createMatchState = async (matchId: string, state: any) => {
  await redis.set(MATCH_STATE_PREFIX + matchId, JSON.stringify(state));
};

export const getMatchState = async (matchId: string) => {
  const raw = await redis.get(MATCH_STATE_PREFIX + matchId);
  return raw ? JSON.parse(raw) : null;
};

export const updateMatchState = async (matchId: string, patch: Partial<any>) => {
  const current = (await getMatchState(matchId)) || {};
  const next = { ...current, ...patch };
  await createMatchState(matchId, next);
  return next;
};

export const deleteMatchState = async (matchId: string) => {
  await redis.del(MATCH_STATE_PREFIX + matchId);
};
