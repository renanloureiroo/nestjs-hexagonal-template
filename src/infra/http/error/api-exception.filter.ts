import { STATUS_CODES } from 'node:http';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { type Request, type Response } from 'express';
import { ApplicationError } from '../../../core/error/application-error.js';
import { InvalidRequestError } from '../validation/invalid-request.error.js';
import { httpStatusOf } from './error-type-http-status.js';
import { type ProblemDetailDTO } from './problem-detail.dto.js';

const VALIDATION_CODE = 'request.invalid';
const ROUTE_NOT_FOUND_CODE = 'request.not_found';
const UNEXPECTED_CODE = 'internal.unexpected';

export type TraceIdProvider = () => string | undefined;

export const activeTraceId: TraceIdProvider = () => {
  const context = trace.getActiveSpan()?.spanContext();
  return context !== undefined && context.traceId !== '0'.repeat(32) ? context.traceId : undefined;
};

interface Failure {
  readonly status: number;
  readonly detail: string;
  readonly code: string;
  readonly errors?: Record<string, string>;
}

// Toda falha HTTP sai daqui, em RFC 9457 e com `code` estável. Controllers nunca traduzem erro.
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private static readonly logger = new Logger(ApiExceptionFilter.name);

  constructor(private readonly currentTraceId: TraceIdProvider = activeTraceId) {}

  catch(error: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const failure = this.failureOf(error);

    response
      .status(failure.status)
      .type('application/problem+json')
      .json(this.problemOf(failure, request));
  }

  private failureOf(error: unknown): Failure {
    if (error instanceof ApplicationError) {
      ApiExceptionFilter.logger.log(`Erro de aplicação [${error.code}] ${error.message}`);
      return { status: httpStatusOf(error.type), detail: error.message, code: error.code };
    }
    if (error instanceof InvalidRequestError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        detail: 'Requisição inválida',
        code: VALIDATION_CODE,
        errors: error.fields,
      };
    }
    if (error instanceof HttpException && error.getStatus() < 500) {
      return frameworkFailureOf(error.getStatus());
    }
    ApiExceptionFilter.logger.error('Erro inesperado ao processar a requisição', error);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'Erro inesperado ao processar a requisição',
      code: UNEXPECTED_CODE,
    };
  }

  private problemOf(failure: Failure, request: Request): ProblemDetailDTO {
    const traceId = this.currentTraceId();
    return {
      type: 'about:blank',
      title: STATUS_CODES[failure.status] ?? 'Error',
      status: failure.status,
      detail: failure.detail,
      instance: request.originalUrl.split('?')[0] ?? request.originalUrl,
      code: failure.code,
      ...(traceId !== undefined && { traceId }),
      ...(failure.errors !== undefined && { errors: failure.errors }),
    };
  }
}

// Falhas detectadas pelo próprio Nest antes do controller. JSON malformado e path com
// encoding inválido chegam como BadRequestException carregando a mensagem do parser, que
// nunca é repassada ao cliente.
function frameworkFailureOf(status: number): Failure {
  if (status === HttpStatus.NOT_FOUND) {
    return { status, detail: 'Recurso não encontrado', code: ROUTE_NOT_FOUND_CODE };
  }
  if (status === HttpStatus.BAD_REQUEST) {
    return { status, detail: 'Requisição malformada', code: VALIDATION_CODE };
  }
  return { status, detail: STATUS_CODES[status] ?? 'Requisição inválida', code: VALIDATION_CODE };
}
