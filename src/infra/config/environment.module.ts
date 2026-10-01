import { Global, Module } from '@nestjs/common';
import { type Environment, loadEnvironment } from './environment.js';

export const ENVIRONMENT = Symbol('Environment');

@Global()
@Module({
  providers: [{ provide: ENVIRONMENT, useFactory: (): Environment => loadEnvironment() }],
  exports: [ENVIRONMENT],
})
export class EnvironmentModule {}
