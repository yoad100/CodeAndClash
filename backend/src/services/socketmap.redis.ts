import redis from './redis.client';

const SOCKET_MAP_PREFIX = 'socketmap:'; // socketId -> userId
const USER_SOCKET_SET_PREFIX = 'socketset:'; // userId -> Set<socketId>

export const setSocketUser = async (socketId: string, userId: string) => {
  const pipeline = redis.multi();
  pipeline.set(SOCKET_MAP_PREFIX + socketId, userId);
  if (userId) {
    pipeline.sadd(USER_SOCKET_SET_PREFIX + userId, socketId);
  }
  await pipeline.exec();
};

export const getSocketUser = async (socketId: string) => {
  return redis.get(SOCKET_MAP_PREFIX + socketId);
};

export const deleteSocketUser = async (socketId: string) => {
  const userId = await redis.get(SOCKET_MAP_PREFIX + socketId);
  const pipeline = redis.multi();
  pipeline.del(SOCKET_MAP_PREFIX + socketId);
  if (userId) {
    pipeline.srem(USER_SOCKET_SET_PREFIX + userId, socketId);
  }
  await pipeline.exec();
  return userId;
};

export const getUserSockets = async (userId: string): Promise<string[]> => {
  if (!userId) return [];
  const sockets = await redis.smembers(USER_SOCKET_SET_PREFIX + userId);
  return sockets || [];
};

export const removeUserSocket = async (userId: string, socketId: string) => {
  if (!userId || !socketId) return;
  await redis.srem(USER_SOCKET_SET_PREFIX + userId, socketId);
};

// Atomically claim a single active socket for a user.
// Returns the previous socket ids that were present for this user (may include the new socket if it was already present).
export const setSingleSocketUser = async (socketId: string, userId: string): Promise<string[]> => {
  if (!userId) return [];
  const setKey = USER_SOCKET_SET_PREFIX + userId;
  const mapKey = SOCKET_MAP_PREFIX + socketId;
  try {
    // Use MULTI/EXEC so the SMEMBERS, SET and SADD run atomically relative to other clients
    const multi = redis.multi();
    multi.smembers(setKey);
    multi.set(mapKey, userId);
    multi.sadd(setKey, socketId);
    // exec returns array of [err, result] entries when using ioredis
    // The first command's result (smembers) will be at index 0
    const res = await (multi as any).exec();
    if (Array.isArray(res) && res.length > 0) {
      const first = res[0];
      // first is [err, value]
      if (Array.isArray(first) && first.length >= 2) {
        return Array.isArray(first[1]) ? first[1].map(String) : [];
      }
      return Array.isArray(first) ? first.map(String) : [];
    }
  } catch (e) {
    // fallback: try best-effort
    try {
      const prev = await redis.smembers(setKey);
      await redis.set(mapKey, userId);
      await redis.sadd(setKey, socketId);
      return prev || [];
    } catch (err) {
      return [];
    }
  }
  return [];
};
