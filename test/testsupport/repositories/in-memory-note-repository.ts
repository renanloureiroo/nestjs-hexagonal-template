import { NoteRepository } from '../../../src/modules/example/application/repositories/note-repository.js';
import { type Note } from '../../../src/modules/example/domain/entities/note.js';
import { type NoteId } from '../../../src/modules/example/domain/entities/note-id.js';

export class InMemoryNoteRepository extends NoteRepository {
  private readonly notes = new Map<string, Note>();

  async save(note: Note): Promise<Note> {
    this.notes.set(note.id.value, note);
    return note;
  }

  async findById(id: NoteId): Promise<Note | null> {
    return this.notes.get(id.value) ?? null;
  }

  findAll(): Note[] {
    return [...this.notes.values()];
  }
}
