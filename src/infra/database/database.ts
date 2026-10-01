import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger } from '@nestjs/common';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

type Transaction = Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0];

// Executor é o que os adaptadores usam: a transação corrente, se houver, ou o pool.
export type Executor = NodePgDatabase | Transaction;

interface TransactionContext {
  readonly tx: Transaction;
  readonly afterCommit: Array<() => Promise<void>>;
}

// Propaga a transação pelo AsyncLocalStorage, como o Spring faz por thread. Adaptadores não
// recebem a transação por parâmetro e casos de uso não sabem que ela existe.
export class Database {
  private static readonly logger = new Logger(Database.name);

  private readonly storage = new AsyncLocalStorage<TransactionContext>();

  constructor(private readonly db: NodePgDatabase) {}

  get executor(): Executor {
    return this.storage.getStore()?.tx ?? this.db;
  }

  get inTransaction(): boolean {
    return this.storage.getStore() !== undefined;
  }

  // Propagação REQUIRED: uma transação aninhada participa da transação externa.
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.inTransaction) {
      return work();
    }
    const afterCommit: Array<() => Promise<void>> = [];
    const result = await this.db.transaction((tx) => this.storage.run({ tx, afterCommit }, work));
    await this.runAfterCommit(afterCommit);
    return result;
  }

  // Sem transação ativa, o callback executa imediatamente: não há commit a esperar.
  async afterCommit(callback: () => Promise<void>): Promise<void> {
    const context = this.storage.getStore();
    if (context === undefined) {
      await callback();
      return;
    }
    context.afterCommit.push(callback);
  }

  // O commit já aconteceu: falha de um callback é registrada e não desfaz a resposta.
  private async runAfterCommit(callbacks: Array<() => Promise<void>>): Promise<void> {
    for (const callback of callbacks) {
      await callback().catch((error: unknown) =>
        Database.logger.error('Falha ao executar callback após o commit', error),
      );
    }
  }
}
