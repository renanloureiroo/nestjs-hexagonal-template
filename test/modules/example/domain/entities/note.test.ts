import { NoteCreated } from '../../../../../src/modules/example/domain/events/note-created.js';
import { Note } from '../../../../../src/modules/example/domain/entities/note.js';
import { NoteId } from '../../../../../src/modules/example/domain/entities/note-id.js';
import { NoteTitle } from '../../../../../src/modules/example/domain/valueobjects/note-title.js';

describe('Note', () => {
  it('registra evento quando nasce', () => {
    const before = new Date();

    const note = Note.create(NoteTitle.of('Minha nota'));

    expect(note.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(note.domainEvents()).toHaveLength(1);
    const event = note.domainEvents()[0];
    expect(event).toBeInstanceOf(NoteCreated);
    expect((event as NoteCreated).noteId.equals(note.id)).toBe(true);
    expect(event?.occurredAt).toEqual(note.createdAt);
  });

  it('restore preserva identidade e não registra evento', () => {
    const id = NoteId.generate();
    const createdAt = new Date('2026-01-01T00:00:00Z');

    const note = Note.restore(id, NoteTitle.of('Minha nota'), createdAt);

    expect(note.id.equals(id)).toBe(true);
    expect(note.createdAt).toEqual(createdAt);
    expect(note.domainEvents()).toHaveLength(0);
  });

  it('pull devolve e limpa eventos pendentes', () => {
    const note = Note.create(NoteTitle.of('Minha nota'));

    expect(note.pullDomainEvents()).toHaveLength(1);
    expect(note.domainEvents()).toHaveLength(0);
  });

  it('compara por tipo concreto e identificador', () => {
    const note = Note.create(NoteTitle.of('Minha nota'));
    const sameIdentity = Note.restore(note.id, NoteTitle.of('Outro título'), note.createdAt);

    expect(note.equals(sameIdentity)).toBe(true);
    expect(note.equals(Note.create(NoteTitle.of('Minha nota')))).toBe(false);
  });
});
