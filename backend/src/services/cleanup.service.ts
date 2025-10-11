import redis from './redis.client';
import logger from '../logger';

export class SocketCleanupService {
  private static instance: SocketCleanupService;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  
  static getInstance(): SocketCleanupService {
    if (!this.instance) {
      this.instance = new SocketCleanupService();
    }
    return this.instance;
  }
  
  startCleanup() {
    // Clean up stale socket mappings every 5 minutes
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupStaleSocketMappings();
      await this.cleanupExpiredMatches();
    }, 5 * 60 * 1000);
  }
  
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  private async cleanupStaleSocketMappings() {
    try {
      const pattern = 'usermatch:*';
      const keys = await redis.keys(pattern);
      
      for (const key of keys) {
        const matchId = await redis.get(key);
        if (!matchId) continue;
        
        // Check if match still exists in Redis
        const matchState = await redis.get(`match:${matchId}`);
        if (!matchState) {
          await redis.del(key);
          logger.debug('Cleaned up stale user match mapping: %s', key);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup stale socket mappings: %o', error);
    }
  }
  
  private async cleanupExpiredMatches() {
    try {
      const pattern = 'match:*';
      const keys = await redis.keys(pattern);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const key of keys) {
        const matchData = await redis.get(key);
        if (!matchData) continue;
        
        try {
          const match = JSON.parse(matchData);
          const questionEndAt = match.questionEndAt || match.createdAt || 0;
          
          if (now - questionEndAt > maxAge) {
            await redis.del(key);
            logger.debug('Cleaned up expired match: %s', key);
          }
        } catch (parseError) {
          // Invalid JSON, remove it
          await redis.del(key);
          logger.debug('Cleaned up corrupted match data: %s', key);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup expired matches: %o', error);
    }
  }
  
  async cleanupUserSession(userId: string, socketId: string) {
    try {
      // Remove from all queues
      const queueKeys = await redis.keys('queue:*');
      for (const queueKey of queueKeys) {
        const items = await redis.lrange(queueKey, 0, -1);
        for (const item of items) {
          try {
            const entry = JSON.parse(item);
            if (entry.userId === userId || entry.socketId === socketId) {
              await redis.lrem(queueKey, 0, item);
            }
          } catch {}
        }
      }
      
      // Remove socket mapping
      await redis.del(`socket:${socketId}`);
      
      // Remove user match mapping if no active match
      const matchId = await redis.get(`usermatch:${userId}`);
      if (matchId) {
        const matchState = await redis.get(`match:${matchId}`);
        if (!matchState) {
          await redis.del(`usermatch:${userId}`);
        }
      }
      
      logger.debug('Cleaned up user session: userId=%s socketId=%s', userId, socketId);
    } catch (error) {
      logger.warn('Failed to cleanup user session: %o', error);
    }
  }
}