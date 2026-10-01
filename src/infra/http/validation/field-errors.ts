import { type ValidationError } from 'class-validator';

// Uma mensagem por campo, com caminho pontuado para objetos aninhados.
export function fieldErrorsOf(
  errors: readonly ValidationError[],
  prefix = '',
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const error of errors) {
    const path = prefix === '' ? error.property : `${prefix}.${error.property}`;
    const message = Object.values(error.constraints ?? {})[0];
    if (message !== undefined) {
      fields[path] ??= message;
    }
    Object.assign(fields, fieldErrorsOf(error.children ?? [], path));
  }
  return fields;
}
