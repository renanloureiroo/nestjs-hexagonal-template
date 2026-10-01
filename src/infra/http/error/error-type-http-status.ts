import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../core/error/error-type.js';

// Único lugar onde ErrorType vira status HTTP. O Record exige um status para cada tipo:
// um ErrorType novo não compila até ganhar seu mapeamento.
const STATUS_BY_TYPE: Record<ErrorType, HttpStatus> = {
  [ErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorType.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [ErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorType.BUSINESS_RULE]: HttpStatus.UNPROCESSABLE_ENTITY,
};

export function httpStatusOf(type: ErrorType): HttpStatus {
  return STATUS_BY_TYPE[type];
}
