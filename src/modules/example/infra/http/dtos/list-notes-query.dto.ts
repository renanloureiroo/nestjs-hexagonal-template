import { ApiPropertyOptional } from '@nestjs/swagger';
import { IntMax, IntMin } from '../../../../../infra/http/validation/constraints.js';
import { QueryNumber } from '../../../../../infra/http/validation/query-number.js';
import { type ListNotesInput } from '../../../application/usecases/list-notes.use-case.js';

export class ListNotesQueryDTO {
  static readonly MAX_SIZE = 100;

  @ApiPropertyOptional({ description: 'Página, a partir de 0', default: 0, minimum: 0 })
  @QueryNumber()
  @IntMin(0, 'Página deve ser maior ou igual a 0')
  page: number = 0;

  @ApiPropertyOptional({
    description: 'Itens por página',
    default: 20,
    minimum: 1,
    maximum: ListNotesQueryDTO.MAX_SIZE,
  })
  @QueryNumber()
  @IntMin(1, 'Tamanho deve estar entre 1 e 100')
  @IntMax(ListNotesQueryDTO.MAX_SIZE, 'Tamanho deve estar entre 1 e 100')
  size: number = 20;

  toInput(): ListNotesInput {
    return { page: this.page, size: this.size };
  }
}
