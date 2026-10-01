import { DomainError } from '../../../../core/error/domain-error.js';
import { ErrorType } from '../../../../core/error/error-type.js';
import { Id } from '../../../../core/identity/id.js';

export class NoteId extends Id {
  private static readonly INVALID_CODE = 'note.id_invalid';

  private constructor(value: string) {
    super(value);
    if (!Id.isUuid(value)) {
      throw new DomainError(
        ErrorType.VALIDATION,
        NoteId.INVALID_CODE,
        'Identificador de nota inválido',
      );
    }
  }

  static generate(): NoteId {
    return new NoteId(Id.newValue());
  }

  static of(value: string): NoteId {
    return new NoteId(value);
  }
}
