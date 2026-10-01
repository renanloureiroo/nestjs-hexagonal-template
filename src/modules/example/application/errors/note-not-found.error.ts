import { NotFoundError } from '../../../../core/error/not-found-error.js';
import { type NoteId } from '../../domain/entities/note-id.js';

export class NoteNotFoundError extends NotFoundError {
  private static readonly CODE = 'note.not_found';

  constructor(readonly noteId: NoteId) {
    super(NoteNotFoundError.CODE, `Nota não encontrada: ${noteId}`);
  }
}
