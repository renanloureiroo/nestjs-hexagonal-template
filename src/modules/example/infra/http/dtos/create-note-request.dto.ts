import { ApiProperty } from '@nestjs/swagger';
import { MaxChars, NotBlank } from '../../../../../infra/http/validation/constraints.js';
import { type CreateNoteInput } from '../../../application/usecases/create-note.use-case.js';
import { NoteTitle } from '../../../domain/valueobjects/note-title.js';

export class CreateNoteRequestDTO {
  @ApiProperty({ description: 'Título da nota', example: 'Minha primeira nota', maxLength: 120 })
  @NotBlank('Título é obrigatório')
  @MaxChars(NoteTitle.MAX_LENGTH, 'Título não pode passar de 120 caracteres')
  title!: string;

  toInput(): CreateNoteInput {
    return { title: this.title };
  }
}
