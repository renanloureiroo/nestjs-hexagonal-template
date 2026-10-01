import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEventPublisher } from '../../core/event/domain-event-publisher.js';
import { type DomainEvent } from '../../core/event/domain-event.js';
import { Database } from '../database/database.js';

// Listeners recebem o evento somente após o commit, como @TransactionalEventListener(AFTER_COMMIT).
// Um rollback descarta os eventos.
@Injectable()
export class EventEmitterDomainEventPublisher extends DomainEventPublisher {
  constructor(
    private readonly emitter: EventEmitter2,
    private readonly database: Database,
  ) {
    super();
  }

  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.database.afterCommit(async () => {
        await this.emitter.emitAsync(event.name, event);
      });
    }
  }
}
