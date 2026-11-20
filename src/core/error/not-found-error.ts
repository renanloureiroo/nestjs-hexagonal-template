import { ApplicationError } from './application-error.js';
import { ErrorType } from './error-type.js';

export class NotFoundError extends ApplicationError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(ErrorType.NOT_FOUND, code, message, details, options);
  }
}
