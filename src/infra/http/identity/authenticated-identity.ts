import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { type RequestIdentity } from './request-identity.js';

/** A identidade viaja na própria Request, que já é por requisição: não há contexto ambiente. */
const IDENTITY = Symbol('RequestIdentity');

type IdentifiedRequest = Request & { [IDENTITY]?: RequestIdentity };

export function attachIdentity(request: Request, identity: RequestIdentity): void {
  (request as IdentifiedRequest)[IDENTITY] = identity;
}

export function identityOf(request: Request): RequestIdentity | undefined {
  return (request as IdentifiedRequest)[IDENTITY];
}

/**
 * Parâmetro do controller com a identidade de quem chamou. Só funciona em rotas protegidas por
 * `@RequiresIdentity()`; sem o guard, a ausência é defeito de cabeamento, não da requisição.
 */
export const AuthenticatedIdentity = createParamDecorator(
  (_: unknown, context: ExecutionContext): RequestIdentity => {
    const identity = identityOf(context.switchToHttp().getRequest<Request>());
    if (identity === undefined) {
      throw new Error('Rota sem @RequiresIdentity(): identidade não foi lida');
    }
    return identity;
  },
);
