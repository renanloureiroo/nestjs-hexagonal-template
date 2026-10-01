import { ApplicationError } from './application-error.js';
import { ErrorType } from './error-type.js';

export class ForbiddenError extends ApplicationError {
  constructor(code: string, message: string, options?: ErrorOptions) {
    super(ErrorType.FORBIDDEN, code, message, options);
  }
}
