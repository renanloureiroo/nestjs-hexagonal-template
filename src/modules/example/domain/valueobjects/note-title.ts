import { DomainError } from '../../../../core/error/domain-error.js';
import { ErrorType } from '../../../../core/error/error-type.js';

export class NoteTitle {
  static readonly MAX_LENGTH = 120;
  private static readonly INVALID_CODE = 'note.title_invalid';

  readonly value: string;

  private constructor(value: string) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new DomainError(ErrorType.VALIDATION, NoteTitle.INVALID_CODE, 'Título é obrigatório');
    }
    if (value.length > NoteTitle.MAX_LENGTH) {
      throw new DomainError(
        ErrorType.VALIDATION,
        NoteTitle.INVALID_CODE,
        `Título não pode passar de ${NoteTitle.MAX_LENGTH} caracteres`,
      );
    }
    this.value = value;
  }

  static of(value: string): NoteTitle {
    return new NoteTitle(value);
  }

  equals(other: unknown): boolean {
    return other instanceof NoteTitle && other.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
