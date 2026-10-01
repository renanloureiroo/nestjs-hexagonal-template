import { CreateNoteUseCase } from '../../../../../src/modules/example/application/usecases/create-note.use-case.js';
import { NoteId } from '../../../../../src/modules/example/domain/entities/note-id.js';
import { NoteCreated } from '../../../../../src/modules/example/domain/events/note-created.js';
import { InMemoryDomainEventPublisher } from '../../../../testsupport/events/in-memory-domain-event-publisher.js';
import { NoteFactory } from '../../../../testsupport/factories/note-factory.js';
import { InMemoryNoteRepository } from '../../../../testsupport/repositories/in-memory-note-repository.js';

describe('CreateNoteUseCase', () => {
  let notes: InMemoryNoteRepository;
  let events: InMemoryDomainEventPublisher;
  let sut: CreateNoteUseCase;

  beforeEach(() => {
    notes = new InMemoryNoteRepository();
    events = new InMemoryDomainEventPublisher();
    sut = new CreateNoteUseCase(notes, events);
  });

  it('cria e persiste uma nota', async () => {
    const output = await sut.execute(NoteFactory.aNote().asCreateInput());

    const saved = await notes.findById(NoteId.of(output.id));

    expect(saved?.title.value).toBe('Minha primeira nota');
    expect(output.createdAt).toBeInstanceOf(Date);
    expect(events.published()).toHaveLength(1);
    const event = events.published()[0];
    expect(event).toBeInstanceOf(NoteCreated);
    expect((event as NoteCreated).noteId.value).toBe(output.id);
  });

  it('não persiste nem publica quando o título é inválido', async () => {
    await expect(
      sut.execute(NoteFactory.aNote().withTitle(' ').asCreateInput()),
    ).rejects.toMatchObject({
      code: 'note.title_invalid',
    });

    expect(notes.findAll()).toHaveLength(0);
    expect(events.published()).toHaveLength(0);
  });
});
