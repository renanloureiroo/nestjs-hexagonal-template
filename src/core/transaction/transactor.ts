// Porta declarada como classe abstrata: serve de token de injeção sem acoplar o núcleo ao Nest.
export abstract class Transactor {
  abstract inTransaction<T>(work: () => Promise<T>): Promise<T>;
}
