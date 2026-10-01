import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './infra/app.module.js';
import { loadEnvironment } from './infra/config/environment.js';
import { configureApp } from './infra/http/configure-app.js';

const environment = loadEnvironment();
const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  logger: environment.logLevels,
});

configureApp(app, environment);
await app.listen(environment.port);
