import { type PageQuery } from '../../../../core/pagination/page-query.js';
import { type UseCase } from '../../../../core/usecase/use-case.js';
import { type Note } from '../../domain/entities/note.js';
import { type NoteRepository } from '../repositories/note-repository.js';

export type ListNotesInput = PageQuery;

export interface ListNotesOutputItem {
  readonly id: string;
  readonly title: string;
  readonly createdAt: Date;
}

export interface ListNotesOutput {
  readonly items: readonly ListNotesOutputItem[];
  readonly total: number;
}

export class ListNotesUseCase implements UseCase<ListNotesInput, ListNotesOutput> {
  constructor(private readonly notes: NoteRepository) {}

  async execute(input: ListNotesInput): Promise<ListNotesOutput> {
    const page = await this.notes.findPage(input);
    return { items: page.items.map(itemOf), total: page.total };
  }
}

function itemOf(note: Note): ListNotesOutputItem {
  return { id: note.id.value, title: note.title.value, createdAt: note.createdAt };
}
