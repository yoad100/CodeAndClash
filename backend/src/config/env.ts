import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('900s'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional production-specific validations
    if (env.NODE_ENV === 'production') {
      if (env.JWT_SECRET === 'secret') {
        throw new Error('JWT_SECRET must be changed from default in production');
      }
      
      if (!env.SENTRY_DSN) {
        console.warn('SENTRY_DSN not set - error tracking disabled in production');
      }
    }
    
    return env;
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}

export type ValidatedEnv = ReturnType<typeof validateEnvironment>;