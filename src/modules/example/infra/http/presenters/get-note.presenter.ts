import { type GetNoteOutput } from '../../../application/usecases/get-note.use-case.js';
import { NoteResponseDTO } from '../dtos/note-response.dto.js';

export const GetNotePresenter = {
  present(output: GetNoteOutput): NoteResponseDTO {
    return new NoteResponseDTO(output.id, output.title, output.createdAt.toISOString());
  },
} as const;
