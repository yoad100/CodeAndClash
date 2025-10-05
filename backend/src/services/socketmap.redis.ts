import redis from './redis.client';

const SOCKET_MAP_PREFIX = 'socketmap:'; // socketId -> userId

export const setSocketUser = async (socketId: string, userId: string) => {
  await redis.set(SOCKET_MAP_PREFIX + socketId, userId);
};

export const getSocketUser = async (socketId: string) => {
  return redis.get(SOCKET_MAP_PREFIX + socketId);
};

export const deleteSocketUser = async (socketId: string) => {
  await redis.del(SOCKET_MAP_PREFIX + socketId);
};
