import redis from './redis.client';
import logger from '../logger';

const MATCH_STATE_PREFIX = 'matchstate:';
const memoryFallback = new Map<string, any>();

const toKey = (matchId: string) => MATCH_STATE_PREFIX + matchId;

const clone = <T>(value: T): T => {
  if (value === null || value === undefined) return value as T;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    logger.warn('[match.redis] clone failed for %s: %o', typeof value, err);
    return value;
  }
};

const persistInMemory = (matchId: string, state: any) => {
  memoryFallback.set(matchId, clone(state));
};

export const createMatchState = async (matchId: string, state: any) => {
  const key = toKey(matchId);
  const payload = JSON.stringify(state ?? {});
  try {
    await redis.set(key, payload);
    logger.debug('[match.redis] createMatchState redis ok %s len=%s', matchId, Array.isArray(state?.questions) ? state.questions.length : 0);
  } catch (err) {
    logger.warn('[match.redis] createMatchState redis error for %s: %o (falling back to memory)', matchId, err);
  }
  persistInMemory(matchId, state ?? {});
};

export const getMatchState = async (matchId: string) => {
  const key = toKey(matchId);
  try {
    const raw = await redis.get(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      persistInMemory(matchId, parsed);
      return parsed;
    }
  } catch (err) {
    logger.warn('[match.redis] getMatchState redis error for %s: %o', matchId, err);
  }
  const fallback = memoryFallback.get(matchId);
  if (fallback) {
    logger.debug('[match.redis] getMatchState using memory fallback for %s', matchId);
    return clone(fallback);
  }
  return null;
};

export const updateMatchState = async (matchId: string, patch: Partial<any>) => {
  const current = (await getMatchState(matchId)) || {};
  const next = { ...current, ...patch };
  logger.debug('[match.redis] updateMatchState %o', { matchId, patch });
  await createMatchState(matchId, next);
  return next;
};

export const deleteMatchState = async (matchId: string) => {
  const key = toKey(matchId);
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn('[match.redis] deleteMatchState redis error for %s: %o', matchId, err);
  }
  memoryFallback.delete(matchId);
};

export const __clearMatchStateFallback = () => memoryFallback.clear();
