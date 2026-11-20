import { type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { UnauthorizedError } from '../../../../src/core/error/unauthorized-error.js';
import { identityOf } from '../../../../src/infra/http/identity/authenticated-identity.js';
import { IdentityGuard } from '../../../../src/infra/http/identity/identity.guard.js';
import { IdentityResolver } from '../../../../src/infra/http/identity/identity-resolver.js';
import { type RequestIdentity } from '../../../../src/infra/http/identity/request-identity.js';

class FixedIdentityResolver extends IdentityResolver {
  constructor(private readonly identity: RequestIdentity | null) {
    super();
  }

  resolve(): Promise<RequestIdentity | null> {
    return Promise.resolve(this.identity);
  }
}

function contextOf(request: Request): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('IdentityGuard', () => {
  it('deixa passar e guarda a identidade na requisição', async () => {
    const identity = { subject: 'user_1', claims: {} };
    const request = { headers: {} } as Request;
    const sut = new IdentityGuard(new FixedIdentityResolver(identity));

    expect(await sut.canActivate(contextOf(request))).toBe(true);
    expect(identityOf(request)).toEqual(identity);
  });

  it('recusa com 401 e code estável quando não há identidade', async () => {
    const sut = new IdentityGuard(new FixedIdentityResolver(null));

    const result = sut.canActivate(contextOf({ headers: {} } as Request));

    await expect(result).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(result).rejects.toMatchObject({
      type: 'UNAUTHORIZED',
      code: 'auth.unauthenticated',
    });
  });
});
