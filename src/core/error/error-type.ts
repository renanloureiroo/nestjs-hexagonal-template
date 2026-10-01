export const ErrorType = {
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  BUSINESS_RULE: 'BUSINESS_RULE',
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];
