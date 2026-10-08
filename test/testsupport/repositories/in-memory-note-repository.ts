import { Page } from '../../../src/core/pagination/page.js';
import { offsetOf, type PageQuery } from '../../../src/core/pagination/page-query.js';
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

  async findPage(query: PageQuery): Promise<Page<Note>> {
    const sorted = [...this.notes.values()].sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime() || b.id.value.localeCompare(a.id.value),
    );
    const start = offsetOf(query);
    return new Page(sorted.slice(start, start + query.size), sorted.length);
  }

  findAll(): Note[] {
    return [...this.notes.values()];
  }
}
