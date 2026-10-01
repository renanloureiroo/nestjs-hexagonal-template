import { type DomainEvent } from './domain-event.js';

// Porta declarada como classe abstrata: serve de token de injeção sem acoplar o núcleo ao Nest.
export abstract class DomainEventPublisher {
  abstract publish(events: readonly DomainEvent[]): Promise<void>;
}
