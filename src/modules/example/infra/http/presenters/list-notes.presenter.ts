import { type ListNotesOutput } from '../../../application/usecases/list-notes.use-case.js';
import { NotePageResponseDTO } from '../dtos/note-page-response.dto.js';
import { NoteResponseDTO } from '../dtos/note-response.dto.js';

export const ListNotesPresenter = {
  present(output: ListNotesOutput): NotePageResponseDTO {
    return new NotePageResponseDTO(
      output.items.map(
        (item) => new NoteResponseDTO(item.id, item.title, item.createdAt.toISOString()),
      ),
      output.total,
    );
  },
} as const;
