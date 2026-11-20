import { type NestExpressApplication } from '@nestjs/platform-express';
import { type Environment } from '../config/environment.js';
import { configureOpenApi } from './config/openapi.js';
import { ApiExceptionFilter } from './error/api-exception.filter.js';
import { requestValidationPipe } from './validation/request-validation.pipe.js';

/**
 * Configuração compartilhada por main.ts e pelos testes E2E: o E2E sobe a mesma borda HTTP. O
 * parser JSON também aceita `application/merge-patch+json` (RFC 7396), o tipo de um `PATCH`
 * parcial.
 */
export function configureApp(app: NestExpressApplication, environment: Environment): void {
  app.setGlobalPrefix('api');
  app.useBodyParser('json', { type: ['application/json', 'application/merge-patch+json'] });
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  app.useGlobalPipes(requestValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  if (environment.apiDocsEnabled) {
    configureOpenApi(app);
  }
}
