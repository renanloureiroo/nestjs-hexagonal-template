import { ApplicationError } from './application-error.js';
import { ErrorType } from './error-type.js';

export class ConflictError extends ApplicationError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(ErrorType.CONFLICT, code, message, details, options);
  }
}
