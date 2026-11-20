import { type Request } from 'express';
import { IdentityResolver } from './identity-resolver.js';
import { type RequestIdentity } from './request-identity.js';

/** Cobre o `sub` dos provedores comuns (Clerk, Auth0, UUID) com folga e cabe em varchar(64). */
const SUBJECT_PATTERN = /^[A-Za-z0-9_|.@:-]{1,64}$/;

/**
 * Confia no header que o gateway valida e sempre sobrescreve. A API não toca no token: quem garante
 * que o header não veio do cliente é o gateway, então a API nunca pode ficar exposta sem ele.
 */
export class GatewayHeadersIdentityResolver extends IdentityResolver {
  constructor(private readonly subjectHeader: string) {
    super();
  }

  resolve(request: Request): Promise<RequestIdentity | null> {
    const subject = request.headers[this.subjectHeader];
    if (typeof subject !== 'string' || !SUBJECT_PATTERN.test(subject)) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ subject, claims: {} });
  }
}
