import redis from './redis.client';
import logger from '../logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export class SocketRateLimiter {
  constructor(private config: RateLimitConfig) {}
  
  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Clean old entries and count current requests
    await redis.zremrangebyscore(key, '-inf', windowStart);
    const currentCount = await redis.zcard(key);
    
    if (currentCount >= this.config.maxRequests) {
      const resetTime = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestRequestTime = resetTime.length > 1 ? parseInt(resetTime[1]) : now;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequestTime + this.config.windowMs
      };
    }
    
    // Add current request
    await redis.zadd(key, now, `${now}:${Math.random()}`);
    await redis.expire(key, Math.ceil(this.config.windowMs / 1000));
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - currentCount - 1,
      resetTime: now + this.config.windowMs
    };
  }
}

// Pre-configured rate limiters for different socket events
export const socketRateLimiters = {
  findOpponent: new SocketRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyPrefix: 'rate_limit:find_opponent'
  }),
  
  submitAnswer: new SocketRateLimiter({
    windowMs: 10 * 1000, // 10 seconds  
    maxRequests: 50, // High limit for gameplay
    keyPrefix: 'rate_limit:submit_answer'
  }),
  
  createPrivateMatch: new SocketRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5,
    keyPrefix: 'rate_limit:create_private'
  })
};