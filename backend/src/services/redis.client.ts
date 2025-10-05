import Redis from 'ioredis';
import logger from '../logger';

// If no REDIS_URL is set, export a no-op redis client to avoid crashes in dev
const REDIS_URL = process.env.REDIS_URL;

class NoopRedis {
	async ping() { return 'PONG'; }
	async get(_key: string) { return null; }
	async set(_key: string, _val: string) { return 'OK'; }
	async del(_key: string) { return 0; }
	async zadd(_key: string, _score: string, _member: string) { return 0; }
	async zrevrange(_key: string, _start: number, _stop: number, ..._rest: any[]) { return []; }
	async zrevrank(_key: string, _member: string) { return null; }
	async zrangebyscore(_key: string, _min: number | string, _max: number | string, ..._rest: any[]) { return []; }
	async zremrangebyscore(_key: string, _min: number | string, _max: number | string) { return 0; }
	async setex(_key: string, _ttl: number, _val: string) { return 'OK'; }
	async rpush(_key: string, _val: string) { return 0; }
	async lpop(_key: string) { return null; }
	async publish(_channel: string, _msg: string) { return 0; }
	async subscribe(_channel: string) { return; }
	duplicate() { return this; }
	on(_ev: string, _handler: (...args: any[]) => void) { /* noop */ }
	off(_ev: string, _handler?: (...args: any[]) => void) { /* noop */ }
}

let redis: any;
if (!REDIS_URL) {
	logger && logger.warn && logger.warn('REDIS_URL not set — using noop redis client');
	redis = new NoopRedis();
} else {
	const client = new Redis(REDIS_URL);
	// Avoid unhandled exceptions
	client.on('error', (err) => {
		// log but don't let it crash the process
		try { logger && logger.warn && logger.warn('Redis error', err); } catch (e) { /* ignore */ }
	});
	redis = client;
}

export default redis;
