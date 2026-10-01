import { type DomainEvent } from '../../../../core/event/domain-event.js';
import { type NoteId } from '../entities/note-id.js';

export class NoteCreated implements DomainEvent {
  static readonly NAME = 'example.note_created';

  readonly name = NoteCreated.NAME;

  constructor(
    readonly noteId: NoteId,
    readonly occurredAt: Date,
  ) {}
}
