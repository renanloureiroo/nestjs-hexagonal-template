import { DomainError } from '../../../../../src/core/error/domain-error.js';
import { ErrorType } from '../../../../../src/core/error/error-type.js';
import { NoteTitle } from '../../../../../src/modules/example/domain/valueobjects/note-title.js';
import { captureError } from '../../../../testsupport/errors/capture-error.js';

describe('NoteTitle', () => {
  it.each(['Nota', 'Minha primeira nota', 'a'])('aceita título válido: %j', (valid) => {
    expect(NoteTitle.of(valid).value).toBe(valid);
  });

  it.each([null, undefined, '', '   '])('rejeita título ausente: %j', (invalid) => {
    const error = captureError(() => NoteTitle.of(invalid as string));

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ type: ErrorType.VALIDATION, code: 'note.title_invalid' });
  });

  it('respeita o limite máximo', () => {
    expect(NoteTitle.of('a'.repeat(120)).value).toHaveLength(120);

    const error = captureError(() => NoteTitle.of('a'.repeat(121)));

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ code: 'note.title_invalid' });
  });

  it('usa o valor como representação textual', () => {
    expect(String(NoteTitle.of('Nota'))).toBe('Nota');
  });

  it('compara por conteúdo', () => {
    expect(NoteTitle.of('Nota').equals(NoteTitle.of('Nota'))).toBe(true);
    expect(NoteTitle.of('Nota').equals(NoteTitle.of('Outra'))).toBe(false);
  });
});
