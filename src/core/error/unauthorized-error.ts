import { ApplicationError } from './application-error.js';
import { ErrorType } from './error-type.js';

export class UnauthorizedError extends ApplicationError {
  constructor(code: string, message: string, options?: ErrorOptions) {
    super(ErrorType.UNAUTHORIZED, code, message, options);
  }
}
