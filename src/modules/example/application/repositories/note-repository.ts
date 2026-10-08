import { type Page } from '../../../../core/pagination/page.js';
import { type PageQuery } from '../../../../core/pagination/page-query.js';
import { type Note } from '../../domain/entities/note.js';
import { type NoteId } from '../../domain/entities/note-id.js';

// Porta declarada como classe abstrata: serve de token de injeção sem acoplar a aplicação ao Nest.
export abstract class NoteRepository {
  abstract save(note: Note): Promise<Note>;

  // Ausência é `null` explícito no tipo; `undefined` nunca sai de um repositório.
  abstract findById(id: NoteId): Promise<Note | null>;

  // Mais recentes primeiro; empate em createdAt é desfeito pelo id, para a ordem ser estável.
  abstract findPage(query: PageQuery): Promise<Page<Note>>;
}
