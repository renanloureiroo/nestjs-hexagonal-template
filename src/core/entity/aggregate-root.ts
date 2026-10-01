import { type DomainEvent } from '../event/domain-event.js';
import { type Id } from '../identity/id.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<ID extends Id> extends Entity<ID> {
  private readonly pendingEvents: DomainEvent[] = [];

  protected registerEvent(event: DomainEvent): void {
    this.pendingEvents.push(event);
  }

  domainEvents(): readonly DomainEvent[] {
    return [...this.pendingEvents];
  }

  pullDomainEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0);
  }
}
