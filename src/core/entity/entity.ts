import { DomainError } from '../error/domain-error.js';
import { ErrorType } from '../error/error-type.js';
import { type Id } from '../identity/id.js';

const MISSING_ID_CODE = 'entity.id_required';

export abstract class Entity<ID extends Id> {
  readonly id: ID;

  protected constructor(id: ID) {
    if (id == null) {
      throw new DomainError(
        ErrorType.VALIDATION,
        MISSING_ID_CODE,
        'Entidade precisa de um identificador',
      );
    }
    this.id = id;
  }

  equals(other: unknown): boolean {
    if (this === other) {
      return true;
    }
    return (
      other instanceof Entity && other.constructor === this.constructor && this.id.equals(other.id)
    );
  }
}
