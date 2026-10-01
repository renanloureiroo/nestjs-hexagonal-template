import { ValidationPipe } from '@nestjs/common';
import { fieldErrorsOf } from './field-errors.js';
import { InvalidRequestError } from './invalid-request.error.js';

export function requestValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => new InvalidRequestError(fieldErrorsOf(errors)),
  });
}
