import request from 'supertest';
import app from '../helpers/testApp';

describe('Smoke Billing API', () => {
  it('GET /api/bills requires auth token', async () => {
    const res = await request(app).get('/api/bills');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
