import { type NestExpressApplication } from '@nestjs/platform-express';
import { type Environment } from '../config/environment.js';
import { configureOpenApi } from './config/openapi.js';
import { ApiExceptionFilter } from './error/api-exception.filter.js';
import { requestValidationPipe } from './validation/request-validation.pipe.js';

// Configuração compartilhada por main.ts e pelos testes E2E: o E2E sobe a mesma borda HTTP.
export function configureApp(app: NestExpressApplication, environment: Environment): void {
  app.setGlobalPrefix('api');
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  app.useGlobalPipes(requestValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  if (environment.apiDocsEnabled) {
    configureOpenApi(app);
  }
}
