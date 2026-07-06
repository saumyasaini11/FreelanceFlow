import request from 'supertest';
import app from '../app';

describe('GET /api/health', () => {
  it('should return 200 and a healthy status message', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        status: 'healthy',
        timestamp: expect.any(String),
        env: expect.any(String),
      })
    );
  });
});
