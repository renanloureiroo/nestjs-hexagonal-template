import request from 'supertest';
import { describeE2E, E2E_APP_VERSION, e2e } from '../testsupport/e2e/e2e.js';

describeE2E('/health', () => {
  it('informa que a aplicação e o banco estão disponíveis, com a versão da imagem', async () => {
    const { app } = await e2e();

    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP', version: E2E_APP_VERSION });
  });

  it('responde a liveness com a versão, sem depender do banco', async () => {
    const { app } = await e2e();

    const response = await request(app.getHttpServer()).get('/api/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP', version: E2E_APP_VERSION });
  });
});
