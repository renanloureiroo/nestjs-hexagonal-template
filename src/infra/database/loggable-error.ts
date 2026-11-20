import { DrizzleQueryError } from 'drizzle-orm/errors';

/**
 * A mensagem de uma falha de consulta do Drizzle traz os parâmetros (identificadores, tokens, dados
 * pessoais), e o erro do PostgreSQL traz a linha em `detail`. Nada disso vai para o log: ficam só o
 * SQL e a mensagem do banco.
 */
export function loggableError(error: unknown): unknown {
  if (!(error instanceof DrizzleQueryError)) {
    return error;
  }
  const cause = error.cause === undefined ? '' : ` (${error.cause.name}: ${error.cause.message})`;
  const safe = new Error(`Falha na consulta ao banco: ${error.query}${cause}`);
  safe.name = DrizzleQueryError.name;
  return safe;
}
