import { Transactor } from '../../../src/core/transaction/transactor.js';

// Executa o trabalho diretamente e registra a sequência begin → commit/rollback.
export class DirectTransactor extends Transactor {
  private readonly log: string[] = [];

  async inTransaction<T>(work: () => Promise<T>): Promise<T> {
    this.log.push('begin');
    try {
      const result = await work();
      this.log.push('commit');
      return result;
    } catch (error) {
      this.log.push('rollback');
      throw error;
    }
  }

  invocations(): number {
    return this.log.filter((step) => step === 'begin').length;
  }

  steps(): readonly string[] {
    return [...this.log];
  }
}
