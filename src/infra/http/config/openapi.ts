import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Hexagonal Template API')
    .setVersion('v1')
    .setDescription('API de exemplo. Erros seguem RFC 9457 e incluem um code estável.')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/swagger-ui', app, document, {
    jsonDocumentUrl: 'api/v3/api-docs',
    swaggerOptions: { operationsSorter: 'alpha', tagsSorter: 'alpha', docExpansion: 'none' },
  });
}
