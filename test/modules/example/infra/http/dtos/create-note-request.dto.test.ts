import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { fieldErrorsOf } from '../../../../../../src/infra/http/validation/field-errors.js';
import { CreateNoteRequestDTO } from '../../../../../../src/modules/example/infra/http/dtos/create-note-request.dto.js';
import { NoteTitle } from '../../../../../../src/modules/example/domain/valueobjects/note-title.js';
import { captureError } from '../../../../../testsupport/errors/capture-error.js';

describe('CreateNoteRequestDTO', () => {
  it('aceita payload válido e converte para input', () => {
    const request = requestOf({ title: 'Minha nota' });

    expect(violationsOf(request)).toEqual({});
    expect(request.toInput()).toEqual({ title: 'Minha nota' });
  });

  it.each([{}, { title: null }, { title: '' }, { title: '   ' }, { title: 42 }])(
    'rejeita título ausente com a mensagem do domínio: %j',
    (payload) => {
      expect(violationsOf(requestOf(payload))).toEqual({ title: 'Título é obrigatório' });
    },
  );

  it('respeita o limite com a mensagem do domínio', () => {
    expect(violationsOf(requestOf({ title: 'a'.repeat(120) }))).toEqual({});
    expect(violationsOf(requestOf({ title: 'a'.repeat(121) }))).toEqual({
      title: 'Título não pode passar de 120 caracteres',
    });
  });

  it('espelha as mensagens das invariantes do domínio', () => {
    const blank = captureError(() => NoteTitle.of(' ')) as Error;
    const tooLong = captureError(() => NoteTitle.of('a'.repeat(121))) as Error;

    expect(violationsOf(requestOf({ title: ' ' })).title).toBe(blank.message);
    expect(violationsOf(requestOf({ title: 'a'.repeat(121) })).title).toBe(tooLong.message);
  });
});

function requestOf(payload: object): CreateNoteRequestDTO {
  return plainToInstance(CreateNoteRequestDTO, payload);
}

function violationsOf(request: CreateNoteRequestDTO): Record<string, string> {
  return fieldErrorsOf(validateSync(request));
}
