import { type CreateNoteOutput } from '../../../application/usecases/create-note.use-case.js';
import { NoteResponseDTO } from '../dtos/note-response.dto.js';

export const CreateNotePresenter = {
  present(output: CreateNoteOutput): NoteResponseDTO {
    return new NoteResponseDTO(output.id, output.title, output.createdAt.toISOString());
  },
} as const;
