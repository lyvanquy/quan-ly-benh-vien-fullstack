import request from 'supertest';
import app from '../helpers/testApp';

describe('Smoke Patient API', () => {
  it('GET /api/patients requires auth token', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
