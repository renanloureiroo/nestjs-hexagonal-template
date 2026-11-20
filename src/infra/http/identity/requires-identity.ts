import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ProblemDetailDTO } from '../error/problem-detail.dto.js';
import { problemExample } from '../error/problem-example.js';
import { IdentityGuard } from './identity.guard.js';

/**
 * Protege o controller ou a rota. Aplicado por rota, não globalmente: o health e as rotas públicas
 * não têm identidade. O OpenAPI anuncia o Bearer; no modo gateway, quem cobra o token é o gateway.
 */
export function RequiresIdentity(): ClassDecorator & MethodDecorator {
  return applyDecorators(
    UseGuards(IdentityGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Requisição sem identidade, ou com identidade inválida ou expirada',
      type: ProblemDetailDTO,
      example: problemExample({
        status: 401,
        detail: 'Identidade ausente ou inválida',
        instance: '/api/me',
        code: 'auth.unauthenticated',
      }),
    }),
  );
}
