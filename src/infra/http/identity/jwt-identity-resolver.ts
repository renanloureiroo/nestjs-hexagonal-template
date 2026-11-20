import { Logger } from '@nestjs/common';
import { type Request } from 'express';
import { errors, type JWTPayload, type JWTVerifyGetKey, jwtVerify } from 'jose';
import { IdentityResolver } from './identity-resolver.js';
import { type RequestIdentity } from './request-identity.js';

export interface JwtIdentityOptions {
  readonly issuer: string;
  readonly audience: string | null;
  readonly authorizedParties: readonly string[];
  readonly clockToleranceSeconds: number;
}

const BEARER = /^Bearer\s+(\S+)$/i;
const ALGORITHMS = ['RS256', 'ES256', 'EdDSA'];

/**
 * Valida o JWT do header `Authorization: Bearer` contra as chaves públicas do provedor, sem SDK:
 * assinatura, emissor, audiência (quando configurada), validade e o `azp` (quando há origens
 * configuradas, como o Clerk recomenda). Token inválido vira `null`, nunca exceção: o motivo vai
 * para o log em nível debug, e o cliente recebe só o `401`.
 */
export class JwtIdentityResolver extends IdentityResolver {
  private static readonly logger = new Logger(JwtIdentityResolver.name);

  constructor(
    private readonly keys: JWTVerifyGetKey,
    private readonly options: JwtIdentityOptions,
  ) {
    super();
  }

  async resolve(request: Request): Promise<RequestIdentity | null> {
    const token = bearerTokenOf(request.headers.authorization);
    if (token === null) {
      return null;
    }
    try {
      const { payload } = await jwtVerify(token, this.keys, {
        issuer: this.options.issuer,
        algorithms: ALGORITHMS,
        clockTolerance: this.options.clockToleranceSeconds,
        ...(this.options.audience !== null && { audience: this.options.audience }),
      });
      if (typeof payload.sub !== 'string' || payload.sub === '' || !this.authorizedParty(payload)) {
        return null;
      }
      return { subject: payload.sub, claims: Object.freeze({ ...payload }) };
    } catch (error) {
      if (error instanceof errors.JOSEError) {
        JwtIdentityResolver.logger.debug(`Token recusado: ${error.code}`);
        return null;
      }
      throw error;
    }
  }

  private authorizedParty(payload: JWTPayload): boolean {
    const { authorizedParties } = this.options;
    return (
      authorizedParties.length === 0 ||
      (typeof payload.azp === 'string' && authorizedParties.includes(payload.azp))
    );
  }
}

function bearerTokenOf(header: string | undefined): string | null {
  const match = header === undefined ? null : BEARER.exec(header);
  return match?.[1] ?? null;
}
