import client from 'prom-client';

const collectDefault = client.collectDefaultMetrics;
collectDefault();

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
});

export const register = client.register;
