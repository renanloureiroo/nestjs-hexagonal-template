import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProblemDetailDTO } from '../../../../../infra/http/error/problem-detail.dto.js';
import { problemExample } from '../../../../../infra/http/error/problem-example.js';
import { NotePageResponseDTO } from '../dtos/note-page-response.dto.js';
import { NoteResponseDTO } from '../dtos/note-response.dto.js';

const NOTE_ID = 'f59dd6bb-e086-4fe9-a382-a00f8796d260';

// Contrato OpenAPI fora do controller, no papel da interface *Swagger do template Java.
export const NoteControllerSwagger = {
  controller: () => applyDecorators(ApiTags('notes')),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: 'Cria uma nota' }),
      ApiCreatedResponse({ description: 'Nota criada', type: NoteResponseDTO }),
      ApiBadRequestResponse({
        description: 'Requisição inválida',
        type: ProblemDetailDTO,
        example: problemExample({
          status: 400,
          detail: 'Requisição inválida',
          instance: '/api/notes',
          code: 'request.invalid',
          errors: { title: 'Título é obrigatório' },
        }),
      }),
    ),

  list: () =>
    applyDecorators(
      ApiOperation({ summary: 'Lista as notas, mais recentes primeiro' }),
      ApiOkResponse({ description: 'Página de notas', type: NotePageResponseDTO }),
      ApiBadRequestResponse({
        description: 'Paginação inválida',
        type: ProblemDetailDTO,
        example: problemExample({
          status: 400,
          detail: 'Requisição inválida',
          instance: '/api/notes',
          code: 'request.invalid',
          errors: { size: 'Tamanho deve estar entre 1 e 100' },
        }),
      }),
    ),

  get: () =>
    applyDecorators(
      ApiOperation({ summary: 'Consulta uma nota' }),
      ApiOkResponse({ description: 'Nota encontrada', type: NoteResponseDTO }),
      ApiBadRequestResponse({
        description: 'Identificador inválido',
        type: ProblemDetailDTO,
        example: problemExample({
          status: 400,
          detail: 'Identificador de nota inválido',
          instance: '/api/notes/invalido',
          code: 'note.id_invalid',
        }),
      }),
      ApiNotFoundResponse({
        description: 'Nota não encontrada',
        type: ProblemDetailDTO,
        example: problemExample({
          status: 404,
          detail: `Nota não encontrada: ${NOTE_ID}`,
          instance: `/api/notes/${NOTE_ID}`,
          code: 'note.not_found',
        }),
      }),
    ),
} as const;
