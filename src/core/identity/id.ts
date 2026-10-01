import { randomUUID } from 'node:crypto';
import { DomainError } from '../error/domain-error.js';
import { ErrorType } from '../error/error-type.js';

const INVALID_CODE = 'id.invalid';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export abstract class Id {
  readonly value: string;

  protected constructor(value: string) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new DomainError(ErrorType.VALIDATION, INVALID_CODE, 'Identificador não pode ser vazio');
    }
    this.value = value;
  }

  protected static newValue(): string {
    return randomUUID();
  }

  protected static isUuid(value: string): boolean {
    return UUID_PATTERN.test(value);
  }

  // Igualdade por tipo concreto: um NoteId nunca é igual a outro tipo de Id com o mesmo valor.
  equals(other: unknown): boolean {
    return (
      other instanceof Id && other.constructor === this.constructor && other.value === this.value
    );
  }

  toString(): string {
    return this.value;
  }
}
