import { type Request } from 'express';
import { GatewayHeadersIdentityResolver } from '../../../../src/infra/http/identity/gateway-headers-identity-resolver.js';

function requestWith(headers: Record<string, string>): Request {
  return { headers } as unknown as Request;
}

describe('GatewayHeadersIdentityResolver', () => {
  const sut = new GatewayHeadersIdentityResolver('x-auth-subject');

  it('lê o sujeito do header gravado pelo gateway', async () => {
    const identity = await sut.resolve(requestWith({ 'x-auth-subject': 'user_2Nx8b3kQe9WfT1vY' }));

    expect(identity).toEqual({ subject: 'user_2Nx8b3kQe9WfT1vY', claims: {} });
  });

  it('não identifica sem o header', async () => {
    expect(await sut.resolve(requestWith({}))).toBeNull();
  });

  it('não identifica com sujeito fora do formato', async () => {
    expect(await sut.resolve(requestWith({ 'x-auth-subject': 'user 1; drop' }))).toBeNull();
    expect(await sut.resolve(requestWith({ 'x-auth-subject': 'a'.repeat(65) }))).toBeNull();
  });
});
