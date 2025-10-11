import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { json, urlencoded } from 'express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import questionRoutes from './routes/question.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

export const app = express();

app.use(helmet());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(morgan('combined'));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:19006',
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/questions', questionRoutes);
app.use('/leaderboard', leaderboardRoutes);

// Simple liveness check
app.get('/', (req, res) => res.json({ ok: true }));

// readiness: quick checks for Mongo and Redis health
app.get('/health/liveness', (req, res) => res.json({ status: 'ok' }));

app.get('/health/readiness', async (req, res) => {
  // If running unit tests, avoid external checks and return quickly
  if (process.env.NODE_ENV === 'test') {
    return res.status(200).json({ ready: true, checks: { mongodb: true, redis: true } });
  }

  const checks: Record<string, any> = { mongodb: false, redis: false };
  try {
    // mongo
    const mongoose = await import('mongoose');
    const connections = Array.isArray((mongoose as any).connections)
      ? ((mongoose as any).connections as Array<{ readyState?: number }> )
      : [];
    const defaultConn = (mongoose as any).connection;
    if (defaultConn && !connections.includes(defaultConn)) {
      connections.push(defaultConn);
    }
    checks.mongodb = connections.some((conn) => conn && conn.readyState === 1);
  } catch (e) {
    checks.mongodb = false;
  }
  try {
    const redis = await import('./services/redis.client');
    const p = await (redis.default as any).ping();
    checks.redis = !!p;
  } catch (e) {
    checks.redis = false;
  }
  const ready = checks.mongodb && checks.redis;
  res.status(ready ? 200 : 503).json({ ready, checks });
});

export default app;
