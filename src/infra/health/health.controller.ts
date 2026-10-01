import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { type Response } from 'express';
import { Database } from '../database/database.js';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly database: Database) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async health(@Res({ passthrough: true }) response: Response): Promise<{ status: string }> {
    try {
      await this.database.executor.execute(sql`select 1`);
      return { status: 'UP' };
    } catch {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'DOWN' };
    }
  }
}
