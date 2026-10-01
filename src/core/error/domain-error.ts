import { ApplicationError } from './application-error.js';
import { ErrorType } from './error-type.js';

export class DomainError extends ApplicationError {
  constructor(code: string, message: string);
  constructor(type: ErrorType, code: string, message: string);
  constructor(...args: [string, string] | [ErrorType, string, string]) {
    if (args.length === 2) {
      super(ErrorType.BUSINESS_RULE, args[0], args[1]);
    } else {
      super(args[0], args[1], args[2]);
    }
  }
}
