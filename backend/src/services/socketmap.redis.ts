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
