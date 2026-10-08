import 'reflect-metadata';
import { Body, Controller, Get, type INestApplication, Param, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationError } from '../../../../src/core/error/application-error.js';
import { ErrorType } from '../../../../src/core/error/error-type.js';
import { ApiExceptionFilter } from '../../../../src/infra/http/error/api-exception.filter.js';
import { NotBlank } from '../../../../src/infra/http/validation/constraints.js';
import { requestValidationPipe } from '../../../../src/infra/http/validation/request-validation.pipe.js';

class SampleError extends ApplicationError {
  constructor(type: ErrorType) {
    super(type, 'sample.failed', 'Falha de exemplo');
  }
}

class SampleRequest {
  @NotBlank('Nome é obrigatório')
  name!: string;
}

@Controller('samples')
class SampleController {
  @Get('application/:type')
  application(@Param('type') type: ErrorType): never {
    throw new SampleError(type);
  }

  @Get('unexpected')
  unexpected(): never {
    throw new Error('senha=segredo na conexão interna');
  }

  @Post()
  create(@Body() body: SampleRequest): SampleRequest {
    return body;
  }
}

describe('ApiExceptionFilter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ controllers: [SampleController] }).compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(requestValidationPipe());
    app.useGlobalFilters(new ApiExceptionFilter(() => 'trace-123'));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    [ErrorType.NOT_FOUND, 404],
    [ErrorType.CONFLICT, 409],
    [ErrorType.VALIDATION, 400],
    [ErrorType.UNAUTHORIZED, 401],
    [ErrorType.FORBIDDEN, 403],
    [ErrorType.BUSINESS_RULE, 422],
  ])('traduz %s para %i em RFC 9457, sem type about:blank', async (type, status) => {
    const response = await request(app.getHttpServer()).get(`/api/samples/application/${type}`);

    expect(response.status).toBe(status);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toEqual({
      title: expect.any(String),
      status,
      detail: 'Falha de exemplo',
      instance: `/api/samples/application/${type}`,
      code: 'sample.failed',
      traceId: 'trace-123',
    });
  });

  it('esconde detalhes de erro inesperado', async () => {
    const response = await request(app.getHttpServer()).get('/api/samples/unexpected');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ code: 'internal.unexpected', status: 500 });
    expect(response.text).not.toContain('segredo');
  });

  it('reporta erros de validação por campo', async () => {
    const response = await request(app.getHttpServer()).post('/api/samples').send({ name: ' ' });

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({
      code: 'request.invalid',
      errors: { name: 'Nome é obrigatório' },
    });
  });

  it('rejeita JSON malformado sem vazar o erro de parsing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/samples')
      .set('Content-Type', 'application/json')
      .send('{"name":}');

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({
      code: 'request.invalid',
      detail: 'Requisição malformada',
    });
    expect(response.text).not.toMatch(/Unexpected token|JSON at position/);
  });

  it('responde rota inexistente em RFC 9457', async () => {
    const response = await request(app.getHttpServer()).get('/api/inexistente');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ code: 'request.not_found', status: 404 });
  });
});
