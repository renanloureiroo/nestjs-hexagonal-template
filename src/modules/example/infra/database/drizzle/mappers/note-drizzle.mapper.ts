import { Note } from '../../../../domain/entities/note.js';
import { NoteId } from '../../../../domain/entities/note-id.js';
import { NoteTitle } from '../../../../domain/valueobjects/note-title.js';
import { type NoteRow } from '../schema/notes.schema.js';

export const NoteDrizzleMapper = {
  toRow(note: Note): NoteRow {
    return { id: note.id.value, title: note.title.value, createdAt: note.createdAt };
  },

  // Reconstrução sempre por restore: o objeto não nasce agora e não registra eventos.
  toDomain(row: NoteRow): Note {
    return Note.restore(NoteId.of(row.id), NoteTitle.of(row.title), row.createdAt);
  },
} as const;
