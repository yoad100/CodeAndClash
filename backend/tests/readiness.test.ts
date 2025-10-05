/// <reference types="jest" />
import request from 'supertest';
import app from '../src/app';

describe('readiness', () => {
  it('returns 200 or 503', async () => {
    const res = await request(app).get('/health/readiness');
    expect([200, 503]).toContain(res.status);
  });
});


