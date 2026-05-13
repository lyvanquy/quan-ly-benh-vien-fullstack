import request from 'supertest';
import app from '../helpers/testApp';

describe('Smoke Appointment API', () => {
  it('GET /api/appointments requires auth token', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
