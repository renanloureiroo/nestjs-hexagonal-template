import { type DomainEventPublisher } from '../../../../core/event/domain-event-publisher.js';
import { Transactional } from '../../../../core/transaction/transactional.js';
import { type UseCase } from '../../../../core/usecase/use-case.js';
import { Note } from '../../domain/entities/note.js';
import { NoteTitle } from '../../domain/valueobjects/note-title.js';
import { type NoteRepository } from '../repositories/note-repository.js';

export interface CreateNoteInput {
  readonly title: string;
}

export interface CreateNoteOutput {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
}

export class CreateNoteUseCase implements UseCase<CreateNoteInput, CreateNoteOutput> {
  constructor(
    private readonly notes: NoteRepository,
    private readonly events: DomainEventPublisher,
  ) {}

  @Transactional()
  async execute(input: CreateNoteInput): Promise<CreateNoteOutput> {
    const note = Note.create(NoteTitle.of(input.title));
    const saved = await this.notes.save(note);
    await this.events.publish(note.pullDomainEvents());
    return outputOf(saved);
  }
}

function outputOf(note: Note): CreateNoteOutput {
  return { id: note.id.value, title: note.title.value, createdAt: note.createdAt };
}
