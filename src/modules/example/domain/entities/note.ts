import { AggregateRoot } from '../../../../core/entity/aggregate-root.js';
import { NoteCreated } from '../events/note-created.js';
import { type NoteTitle } from '../valueobjects/note-title.js';
import { NoteId } from './note-id.js';

export class Note extends AggregateRoot<NoteId> {
  readonly title: NoteTitle;
  readonly createdAt: Date;

  private constructor(id: NoteId, title: NoteTitle, createdAt: Date) {
    super(id);
    this.title = title;
    this.createdAt = createdAt;
  }

  static create(title: NoteTitle): Note {
    const note = new Note(NoteId.generate(), title, new Date());
    note.registerEvent(new NoteCreated(note.id, note.createdAt));
    return note;
  }

  static restore(id: NoteId, title: NoteTitle, createdAt: Date): Note {
    return new Note(id, title, createdAt);
  }
}
