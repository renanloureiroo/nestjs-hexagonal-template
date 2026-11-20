import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { type Request } from 'express';
import { UnauthorizedError } from '../../../core/error/unauthorized-error.js';
import { attachIdentity } from './authenticated-identity.js';
import { IdentityResolver } from './identity-resolver.js';

/**
 * Exige identidade antes do pipe de validação: sem ela, a resposta é `401` mesmo com corpo
 * inválido. O valor recebido nunca entra na mensagem, porque pode ser o identificador de outra
 * pessoa ou um token.
 */
@Injectable()
export class IdentityGuard implements CanActivate {
  private static readonly CODE = 'auth.unauthenticated';

  constructor(private readonly resolver: IdentityResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const identity = await this.resolver.resolve(request);
    if (identity === null) {
      throw new UnauthorizedError(IdentityGuard.CODE, 'Identidade ausente ou inválida');
    }
    attachIdentity(request, identity);
    return true;
  }
}
