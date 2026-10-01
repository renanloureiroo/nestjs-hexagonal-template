import { type UseCase } from '../../../../core/usecase/use-case.js';
import { type Note } from '../../domain/entities/note.js';
import { NoteId } from '../../domain/entities/note-id.js';
import { NoteNotFoundError } from '../errors/note-not-found.error.js';
import { type NoteRepository } from '../repositories/note-repository.js';

export interface GetNoteInput {
  readonly id: string;
}

export interface GetNoteOutput {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
}

export class GetNoteUseCase implements UseCase<GetNoteInput, GetNoteOutput> {
  constructor(private readonly notes: NoteRepository) {}

  async execute(input: GetNoteInput): Promise<GetNoteOutput> {
    const id = NoteId.of(input.id);
    const note = await this.notes.findById(id);
    if (note === null) {
      throw new NoteNotFoundError(id);
    }
    return outputOf(note);
  }
}

function outputOf(note: Note): GetNoteOutput {
  return { id: note.id.value, title: note.title.value, createdAt: note.createdAt };
}
