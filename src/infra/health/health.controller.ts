import { Controller, Get, HttpCode, HttpStatus, Inject, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { type Response } from 'express';
import { ENVIRONMENT } from '../config/environment.module.js';
import { type Environment } from '../config/environment.js';
import { Database } from '../database/database.js';

/**
 * Corpo do health: a disponibilidade e a versão da imagem em execução, que o deploy consulta até
 * ver a versão nova no ar.
 */
export interface HealthResponse {
  readonly status: 'UP' | 'DOWN';
  readonly version: string;
}

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(
    private readonly database: Database,
    @Inject(ENVIRONMENT) private readonly environment: Environment,
  ) {}

  /**
   * Liveness para o healthcheck do Docker: o processo responde, sem tocar o banco. Um `select 1` a
   * cada 10 s manteria acordado o dia inteiro um banco serverless que dorme sem uso (Neon, Aurora
   * Serverless).
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  live(): HealthResponse {
    return { status: 'UP', version: this.environment.appVersion };
  }

  /** Readiness com o banco, que o deploy consulta depois de subir a versão nova. */
  @Get()
  @HttpCode(HttpStatus.OK)
  async health(@Res({ passthrough: true }) response: Response): Promise<HealthResponse> {
    const version = this.environment.appVersion;
    try {
      await this.database.executor.execute(sql`select 1`);
      return { status: 'UP', version };
    } catch {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'DOWN', version };
    }
  }
}
