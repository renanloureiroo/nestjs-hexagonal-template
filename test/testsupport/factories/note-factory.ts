import { type NoteRepository } from '../../../src/modules/example/application/repositories/note-repository.js';
import { type CreateNoteInput } from '../../../src/modules/example/application/usecases/create-note.use-case.js';
import { Note } from '../../../src/modules/example/domain/entities/note.js';
import { NoteTitle } from '../../../src/modules/example/domain/valueobjects/note-title.js';

export class NoteFactory {
  private title = 'Minha primeira nota';

  private constructor() {}

  static aNote(): NoteFactory {
    return new NoteFactory();
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  build(): Note {
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
