import { Global, Module } from '@nestjs/common';
import { createRemoteJWKSet } from 'jose';
import { ENVIRONMENT } from '../../config/environment.module.js';
import { type Environment } from '../../config/environment.js';
import { GatewayHeadersIdentityResolver } from './gateway-headers-identity-resolver.js';
import { IdentityGuard } from './identity.guard.js';
import { IdentityResolver } from './identity-resolver.js';
import { JwtIdentityResolver } from './jwt-identity-resolver.js';

/** Escolhe o adaptador de identidade pelo ambiente (`IDENTITY_MODE`), uma vez, no boot. */
export function identityResolverFor(environment: Environment): IdentityResolver {
  const config = environment.identity;
  if (config.mode === 'gateway') {
    return new GatewayHeadersIdentityResolver(config.subjectHeader);
  }
  return new JwtIdentityResolver(createRemoteJWKSet(new URL(config.jwksUrl)), {
    issuer: config.issuer,
    audience: config.audience,
    authorizedParties: config.authorizedParties,
    clockToleranceSeconds: config.clockToleranceSeconds,
  });
}

@Global()
@Module({
  providers: [
    { provide: IdentityResolver, inject: [ENVIRONMENT], useFactory: identityResolverFor },
    IdentityGuard,
  ],
  exports: [IdentityResolver, IdentityGuard],
})
export class IdentityModule {}
