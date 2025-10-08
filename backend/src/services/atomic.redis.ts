import redis from './redis.client';

export async function atomicMatchStateUpdate(
  matchId: string, 
  updateFn: (currentState: any) => any
): Promise<boolean> {
  const key = `match:${matchId}`;
  
  // Use Redis transaction for atomic read-modify-write
  while (true) {
    await redis.watch(key);
    const current = await redis.get(key);
    
    if (!current) {
      await redis.unwatch();
      return false;
    }
    
    const currentState = JSON.parse(current);
    const newState = updateFn(currentState);
    
    const multi = redis.multi();
    multi.set(key, JSON.stringify(newState));
    
    const result = await multi.exec();
    
    if (result) {
      // Transaction succeeded
      return true;
    }
    
    // Transaction failed due to concurrent modification, retry
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  }
}