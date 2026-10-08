import { ApiProperty } from '@nestjs/swagger';
import { NoteResponseDTO } from './note-response.dto.js';

export class NotePageResponseDTO {
  @ApiProperty({ type: [NoteResponseDTO] })
  readonly items: readonly NoteResponseDTO[];

  @ApiProperty({ description: 'Total de notas, em todas as páginas', example: 42 })
  readonly total: number;

  constructor(items: readonly NoteResponseDTO[], total: number) {
    this.items = items;
    this.total = total;
  }
}
