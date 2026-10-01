import request from 'supertest';
import { describeE2E, e2e } from '../testsupport/e2e/e2e.js';

describeE2E('/health', () => {
  it('informa que a aplicação e o banco estão disponíveis', async () => {
    const { app } = await e2e();

    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP' });
  });
});
