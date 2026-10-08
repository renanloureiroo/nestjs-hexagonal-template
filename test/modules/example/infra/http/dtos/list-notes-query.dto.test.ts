import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { fieldErrorsOf } from '../../../../../../src/infra/http/validation/field-errors.js';
import { ListNotesQueryDTO } from '../../../../../../src/modules/example/infra/http/dtos/list-notes-query.dto.js';

describe('ListNotesQueryDTO', () => {
  it('usa a primeira página com 20 itens quando nada é informado', () => {
    const query = queryOf({});

    expect(violationsOf(query)).toEqual({});
    expect(query.toInput()).toEqual({ page: 0, size: 20 });
  });

  it('converte os parâmetros da query string', () => {
    const query = queryOf({ page: '2', size: '50' });

    expect(violationsOf(query)).toEqual({});
    expect(query.toInput()).toEqual({ page: 2, size: 50 });
  });

  it.each(['-1', '1.5', 'abc', ''])('rejeita página inválida: %j', (page) => {
    expect(violationsOf(queryOf({ page }))).toEqual({
      page: 'Página deve ser maior ou igual a 0',
    });
  });

  it.each(['0', '101', '2.5', 'abc'])('rejeita tamanho fora do limite: %j', (size) => {
    expect(violationsOf(queryOf({ size }))).toEqual({ size: 'Tamanho deve estar entre 1 e 100' });
  });

  it('aceita os limites do tamanho', () => {
    expect(violationsOf(queryOf({ size: '1' }))).toEqual({});
    expect(violationsOf(queryOf({ size: '100' }))).toEqual({});
  });
});

function queryOf(payload: object): ListNotesQueryDTO {
  return plainToInstance(ListNotesQueryDTO, payload);
}

function violationsOf(query: ListNotesQueryDTO): Record<string, string> {
  return fieldErrorsOf(validateSync(query));
}
