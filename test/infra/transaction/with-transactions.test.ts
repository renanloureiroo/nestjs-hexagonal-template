import { Transactional } from '../../../src/core/transaction/transactional.js';
import { withTransactions } from '../../../src/infra/transaction/with-transactions.js';
import { DirectTransactor } from '../../testsupport/transaction/direct-transactor.js';

class Sample {
  @Transactional()
  async write(fail: boolean): Promise<string> {
    if (fail) {
      throw new Error('falhou');
    }
    return 'ok';
  }

  async read(): Promise<string> {
    return 'lido';
  }
}

describe('withTransactions', () => {
  let transactor: DirectTransactor;
  let sut: Sample;

  beforeEach(() => {
    transactor = new DirectTransactor();
    sut = withTransactions(new Sample(), transactor);
  });

  it('envolve o método marcado em begin → commit', async () => {
    await expect(sut.write(false)).resolves.toBe('ok');

    expect(transactor.steps()).toEqual(['begin', 'commit']);
  });

  it('faz rollback e preserva a mesma exceção', async () => {
    const error = await sut.write(true).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('falhou');
    expect(transactor.steps()).toEqual(['begin', 'rollback']);
  });

  it('não abre transação para método sem marca', async () => {
    await expect(sut.read()).resolves.toBe('lido');

    expect(transactor.invocations()).toBe(0);
  });

  it('mantém o tipo do objeto envolvido', () => {
    expect(sut).toBeInstanceOf(Sample);
  });
});
