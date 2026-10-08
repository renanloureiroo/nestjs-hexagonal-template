import { ListNotesUseCase } from '../../../../../src/modules/example/application/usecases/list-notes.use-case.js';
import { NoteFactory } from '../../../../testsupport/factories/note-factory.js';
import { InMemoryNoteRepository } from '../../../../testsupport/repositories/in-memory-note-repository.js';

describe('ListNotesUseCase', () => {
  let notes: InMemoryNoteRepository;
  let sut: ListNotesUseCase;

  beforeEach(() => {
    notes = new InMemoryNoteRepository();
    sut = new ListNotesUseCase(notes);
  });

  it('devolve as notas mais recentes primeiro, com o total', async () => {
    await NoteFactory.aNote()
      .withTitle('Antiga')
      .withCreatedAt('2026-10-01T10:00:00Z')
      .buildSavedIn(notes);
    await NoteFactory.aNote()
      .withTitle('Nova')
      .withCreatedAt('2026-10-03T10:00:00Z')
      .buildSavedIn(notes);
    await NoteFactory.aNote()
      .withTitle('Meio')
      .withCreatedAt('2026-10-02T10:00:00Z')
      .buildSavedIn(notes);

    const output = await sut.execute({ page: 0, size: 20 });

    expect(output.items.map((item) => item.title)).toEqual(['Nova', 'Meio', 'Antiga']);
    expect(output.items[0]).toEqual({
      id: expect.any(String),
      title: 'Nova',
      createdAt: new Date('2026-10-03T10:00:00Z'),
    });
    expect(output.total).toBe(3);
  });

  it('pagina pelo tamanho pedido sem mudar o total', async () => {
    for (const day of ['01', '02', '03', '04', '05']) {
      await NoteFactory.aNote()
        .withTitle(day)
        .withCreatedAt(`2026-10-${day}T10:00:00Z`)
        .buildSavedIn(notes);
    }

    const output = await sut.execute({ page: 1, size: 2 });

    expect(output.items.map((item) => item.title)).toEqual(['03', '02']);
    expect(output.total).toBe(5);
  });

  it('devolve página vazia depois do fim, mantendo o total', async () => {
    await NoteFactory.aNote().buildSavedIn(notes);

    const output = await sut.execute({ page: 3, size: 20 });

    expect(output).toEqual({ items: [], total: 1 });
  });
});
