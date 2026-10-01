import { type ErrorType } from './error-type.js';

export abstract class ApplicationError extends Error {
  readonly type: ErrorType;
  readonly code: string;

  protected constructor(type: ErrorType, code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
    this.type = type;
    this.code = code;
  }
}
