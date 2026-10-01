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
import { NoteResponseDTO } from '../dtos/note-response.dto.js';

// Contrato OpenAPI fora do controller, no papel da interface *Swagger do template Java.
export const NoteControllerSwagger = {
  controller: () => applyDecorators(ApiTags('notes')),

  create: () =>
    applyDecorators(
      ApiOperation({ summary: 'Cria uma nota' }),
      ApiCreatedResponse({ description: 'Nota criada', type: NoteResponseDTO }),
      ApiBadRequestResponse({ description: 'Requisição inválida', type: ProblemDetailDTO }),
    ),

  get: () =>
    applyDecorators(
      ApiOperation({ summary: 'Consulta uma nota' }),
      ApiOkResponse({ description: 'Nota encontrada', type: NoteResponseDTO }),
      ApiBadRequestResponse({ description: 'Identificador inválido', type: ProblemDetailDTO }),
      ApiNotFoundResponse({ description: 'Nota não encontrada', type: ProblemDetailDTO }),
    ),
} as const;
