import { ErrorType } from '../../../../../src/core/error/error-type.js';
import { NoteNotFoundError } from '../../../../../src/modules/example/application/errors/note-not-found.error.js';
import { GetNoteUseCase } from '../../../../../src/modules/example/application/usecases/get-note.use-case.js';
import { NoteId } from '../../../../../src/modules/example/domain/entities/note-id.js';
import { NoteFactory } from '../../../../testsupport/factories/note-factory.js';
import { InMemoryNoteRepository } from '../../../../testsupport/repositories/in-memory-note-repository.js';

describe('GetNoteUseCase', () => {
  let notes: InMemoryNoteRepository;
  let sut: GetNoteUseCase;

  beforeEach(() => {
    notes = new InMemoryNoteRepository();
    sut = new GetNoteUseCase(notes);
  });

  it('devolve a nota existente', async () => {
    const note = await NoteFactory.aNote().buildSavedIn(notes);

    const output = await sut.execute({ id: note.id.value });

    expect(output.id).toBe(note.id.value);
    expect(output.title).toBe(note.title.value);
  });

  it('rejeita nota inexistente carregando o identificador', async () => {
    const id = NoteId.generate();

    const error = await sut.execute({ id: id.value }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NoteNotFoundError);
    expect(error).toMatchObject({ type: ErrorType.NOT_FOUND, code: 'note.not_found' });
    expect((error as NoteNotFoundError).noteId.equals(id)).toBe(true);
  });

  it('rejeita identificador inválido', async () => {
    await expect(sut.execute({ id: 'invalido' })).rejects.toMatchObject({
      type: ErrorType.VALIDATION,
      code: 'note.id_invalid',
    });
  });
});
