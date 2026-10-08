import { type NoteRepository } from '../../../src/modules/example/application/repositories/note-repository.js';
import { type CreateNoteInput } from '../../../src/modules/example/application/usecases/create-note.use-case.js';
import { Note } from '../../../src/modules/example/domain/entities/note.js';
import { NoteId } from '../../../src/modules/example/domain/entities/note-id.js';
import { NoteTitle } from '../../../src/modules/example/domain/valueobjects/note-title.js';

export class NoteFactory {
  private title = 'Minha primeira nota';
  private fixedCreatedAt: Date | null = null;

  private constructor() {}

  static aNote(): NoteFactory {
    return new NoteFactory();
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  // Instante fixo reconstrói a nota com restore, como se viesse do banco.
  withCreatedAt(createdAt: Date | string): this {
    this.fixedCreatedAt = new Date(createdAt);
    return this;
  }

  build(): Note {
    if (this.fixedCreatedAt !== null) {
      return Note.restore(NoteId.generate(), NoteTitle.of(this.title), this.fixedCreatedAt);
    }
    return Note.create(NoteTitle.of(this.title));
  }

  buildSavedIn(notes: NoteRepository): Promise<Note> {
    return notes.save(this.build());
  }

  asCreateInput(): CreateNoteInput {
    return { title: this.title };
  }

  asRequest(): { title: string } {
    return { title: this.title };
  }
}
