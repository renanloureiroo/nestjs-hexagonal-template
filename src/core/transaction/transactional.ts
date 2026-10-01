// Marca a intenção transacional no caso de uso sem depender de framework. A infraestrutura
// lê a marca e envolve o método em uma transação (ver infra/transaction/with-transactions.ts).
const TRANSACTIONAL_METHODS = Symbol.for('app.transactional-methods');

type Marked = { [TRANSACTIONAL_METHODS]?: Set<string | symbol> };

export function Transactional(): MethodDecorator {
  return (target, propertyKey) => {
    const owner = target as Marked;
    const inherited = owner[TRANSACTIONAL_METHODS] ?? new Set<string | symbol>();
    owner[TRANSACTIONAL_METHODS] = new Set([...inherited, propertyKey]);
  };
}

export function transactionalMethodsOf(instance: object): ReadonlySet<string | symbol> {
  return (instance as Marked)[TRANSACTIONAL_METHODS] ?? new Set();
}
