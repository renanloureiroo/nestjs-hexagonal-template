import { Module } from '@nestjs/common';
import { ExampleModule } from '../modules/example/infra/config/example.module.js';
import { EnvironmentModule } from './config/environment.module.js';
import { DatabaseModule } from './database/database.module.js';
import { EventsModule } from './event/events.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [EnvironmentModule, DatabaseModule, EventsModule, ExampleModule],
  controllers: [HealthController],
})
export class AppModule {}
