import { transactionalMethodsOf } from '../../core/transaction/transactional.js';
import { type Transactor } from '../../core/transaction/transactor.js';

// Equivalente ao advisor AOP do Spring: envolve em transação cada método marcado com
// @Transactional(). O objeto devolvido continua sendo instância da classe original.
export function withTransactions<T extends object>(target: T, transactor: Transactor): T {
  const methods = transactionalMethodsOf(target);
  if (methods.size === 0) {
    return target;
  }
  return new Proxy(target, {
    get(object, property, receiver) {
      const value: unknown = Reflect.get(object, property, receiver);
      if (!methods.has(property) || typeof value !== 'function') {
        return value;
      }
      return (...args: unknown[]) =>
        transactor.inTransaction(async () => value.apply(object, args) as unknown);
    },
  });
}
