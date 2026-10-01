import { DomainEventPublisher } from '../../../src/core/event/domain-event-publisher.js';
import { type DomainEvent } from '../../../src/core/event/domain-event.js';

export class InMemoryDomainEventPublisher extends DomainEventPublisher {
  private readonly events: DomainEvent[] = [];

  async publish(events: readonly DomainEvent[]): Promise<void> {
    this.events.push(...events);
  }

  published(): readonly DomainEvent[] {
    return [...this.events];
  }
}
