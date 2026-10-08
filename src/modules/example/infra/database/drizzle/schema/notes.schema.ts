import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

// Modelo de persistência, separado da entidade de domínio Note.
export const notes = pgTable(
  'notes',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    title: varchar('title', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  // A listagem ordena por created_at desc com desempate por id.
  (table) => [index('notes_created_at_id_idx').on(table.createdAt.desc(), table.id.desc())],
);

export type NoteRow = typeof notes.$inferSelect;
