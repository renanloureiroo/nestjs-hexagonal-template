import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventPublisher } from '../../core/event/domain-event-publisher.js';
import { EventEmitterDomainEventPublisher } from './event-emitter-domain-event-publisher.js';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [{ provide: DomainEventPublisher, useClass: EventEmitterDomainEventPublisher }],
  exports: [DomainEventPublisher],
})
export class EventsModule {}
