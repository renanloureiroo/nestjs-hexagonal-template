import { DomainError } from '../../../../../src/core/error/domain-error.js';
import { ErrorType } from '../../../../../src/core/error/error-type.js';
import { NoteId } from '../../../../../src/modules/example/domain/entities/note-id.js';
import { captureError } from '../../../../testsupport/errors/capture-error.js';

describe('NoteId', () => {
  it('gera identificadores distintos', () => {
    expect(NoteId.generate().equals(NoteId.generate())).toBe(false);
  });

  it('reconstrói a partir de um uuid', () => {
    const value = 'f59dd6bb-e086-4fe9-a382-a00f8796d260';

    expect(NoteId.of(value).value).toBe(value);
    expect(NoteId.of(value).equals(NoteId.of(value))).toBe(true);
  });

  it('rejeita valor ausente', () => {
    const error = captureError(() => NoteId.of(''));

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ type: ErrorType.VALIDATION, code: 'id.invalid' });
  });

  it.each(['invalido', '123', 'f59dd6bb-e086-4fe9-a382'])(
    'rejeita valor fora do formato: %j',
    (invalid) => {
      const error = captureError(() => NoteId.of(invalid));

      expect(error).toMatchObject({ type: ErrorType.VALIDATION, code: 'note.id_invalid' });
    },
  );
});
