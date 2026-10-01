import { eq } from 'drizzle-orm';
import request from 'supertest';
import { NoteId } from '../../../../../../src/modules/example/domain/entities/note-id.js';
import { notes } from '../../../../../../src/modules/example/infra/database/drizzle/schema/notes.schema.js';
import { NoteCreatedListener } from '../../../../../../src/modules/example/infra/events/note-created.listener.js';
import { describeE2E, e2e, type E2EContext } from '../../../../../testsupport/e2e/e2e.js';
import { NoteFactory } from '../../../../../testsupport/factories/note-factory.js';
import { counterValue } from '../../../../../testsupport/telemetry/metrics.js';

describeE2E('/notes', () => {
  let context: E2EContext;

  beforeAll(async () => {
    context = await e2e();
  });

  beforeEach(async () => {
    await context.cleaner.clean();
  });

  it('cria, consulta e persiste uma nota', async () => {
    const eventsBefore = await counterValue(NoteCreatedListener.METRIC_NAME);

    const created = await http()
      .post('/api/notes')
      .send(NoteFactory.aNote().withTitle('Minha nota').asRequest());

    expect(created.status).toBe(201);
    expect(created.body).toEqual({
      id: expect.any(String),
      title: 'Minha nota',
      createdAt: expect.stringMatching(/Z$/),
    });
    expect(created.headers.location).toMatch(new RegExp(`/api/notes/${created.body.id}$`));
    expect(await persistedNote(created.body.id)).toMatchObject({ title: 'Minha nota' });
    expect(await counterValue(NoteCreatedListener.METRIC_NAME)).toBe(eventsBefore + 1);

    const fetched = await http().get(`/api/notes/${created.body.id}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(created.body);
  });

  it('rejeita payload inválido sem persistir', async () => {
    const response = await http().post('/api/notes').send({ title: ' ' });

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({
      code: 'request.invalid',
      errors: { title: 'Título é obrigatório' },
    });
    expect(await notesCount()).toBe(0);
  });

  it('rejeita JSON malformado sem persistir', async () => {
    const response = await http()
      .post('/api/notes')
      .set('Content-Type', 'application/json')
      .send('{"title":}');

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({ code: 'request.invalid' });
    expect(await notesCount()).toBe(0);
  });

  it('devolve 404 para nota inexistente', async () => {
    const response = await http().get(`/api/notes/${NoteId.generate().value}`);

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({ code: 'note.not_found' });
  });

  it('devolve 400 para identificador inválido', async () => {
    const response = await http().get('/api/notes/invalido');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: 'note.id_invalid' });
  });

  it('publica todos os status no OpenAPI', async () => {
    const response = await http().get('/api/v3/api-docs');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths['/api/notes'].post.responses)).toEqual(['201', '400']);
    expect(Object.keys(response.body.paths['/api/notes/{id}'].get.responses)).toEqual([
      '200',
      '400',
      '404',
    ]);
  });

  function http() {
    return request(context.app.getHttpServer());
  }

  async function persistedNote(id: string) {
    const [row] = await context.database.executor.select().from(notes).where(eq(notes.id, id));
    return row;
  }

  async function notesCount(): Promise<number> {
    return (await context.database.executor.select().from(notes)).length;
  }
});
