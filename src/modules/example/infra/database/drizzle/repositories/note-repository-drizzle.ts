import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Database } from '../../../../../../infra/database/database.js';
import { NoteRepository } from '../../../../application/repositories/note-repository.js';
import { type Note } from '../../../../domain/entities/note.js';
import { type NoteId } from '../../../../domain/entities/note-id.js';
import { NoteDrizzleMapper } from '../mappers/note-drizzle.mapper.js';
import { notes } from '../schema/notes.schema.js';

@Injectable()
export class NoteRepositoryDrizzle extends NoteRepository {
  constructor(private readonly database: Database) {
    super();
  }

  async save(note: Note): Promise<Note> {
    const row = NoteDrizzleMapper.toRow(note);
    const [saved] = await this.database.executor
      .insert(notes)
      .values(row)
      .onConflictDoUpdate({ target: notes.id, set: { title: row.title } })
      .returning();
    return NoteDrizzleMapper.toDomain(saved ?? row);
  }

  async findById(id: NoteId): Promise<Note | null> {
    const [row] = await this.database.executor
      .select()
      .from(notes)
      .where(eq(notes.id, id.value))
      .limit(1);
    return row === undefined ? null : NoteDrizzleMapper.toDomain(row);
  }
}
