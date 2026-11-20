import { type ErrorType } from './error-type.js';

/**
 * Membros de extensão RFC 9457 (§3.2): dados legíveis por máquina que o filtro HTTP espalha no
 * problema ao lado de `code`, sem sobrescrever os membros padrão.
 */
export type ErrorDetails = Readonly<Record<string, unknown>>;

export abstract class ApplicationError extends Error {
  readonly type: ErrorType;
  readonly code: string;
  readonly details?: ErrorDetails;

  protected constructor(
    type: ErrorType,
    code: string,
    message: string,
    details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
    this.type = type;
    this.code = code;
    if (details !== undefined) {
      this.details = Object.freeze({ ...details });
    }
  }
}
