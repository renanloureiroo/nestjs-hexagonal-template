import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { CreateNoteUseCase } from '../../../application/usecases/create-note.use-case.js';
import { GetNoteUseCase } from '../../../application/usecases/get-note.use-case.js';
import { ListNotesUseCase } from '../../../application/usecases/list-notes.use-case.js';
import { CreateNoteRequestDTO } from '../dtos/create-note-request.dto.js';
import { ListNotesQueryDTO } from '../dtos/list-notes-query.dto.js';
import { type NotePageResponseDTO } from '../dtos/note-page-response.dto.js';
import { type NoteResponseDTO } from '../dtos/note-response.dto.js';
import { CreateNotePresenter } from '../presenters/create-note.presenter.js';
import { GetNotePresenter } from '../presenters/get-note.presenter.js';
import { ListNotesPresenter } from '../presenters/list-notes.presenter.js';
import { NoteControllerSwagger } from './note.controller.swagger.js';

@NoteControllerSwagger.controller()
@Controller('notes')
export class NoteController {
  constructor(
    private readonly createNote: CreateNoteUseCase,
    private readonly getNote: GetNoteUseCase,
    private readonly listNotes: ListNotesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @NoteControllerSwagger.create()
  async create(
    @Body() request: CreateNoteRequestDTO,
    @Req() http: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<NoteResponseDTO> {
    const body = CreateNotePresenter.present(await this.createNote.execute(request.toInput()));
    response.location(resourceUri(http, body.id));
    return body;
  }

  @Get()
  @NoteControllerSwagger.list()
  async list(@Query() query: ListNotesQueryDTO): Promise<NotePageResponseDTO> {
    return ListNotesPresenter.present(await this.listNotes.execute(query.toInput()));
  }

  @Get(':id')
  @NoteControllerSwagger.get()
  async get(@Param('id') id: string): Promise<NoteResponseDTO> {
    return GetNotePresenter.present(await this.getNote.execute({ id }));
  }
}

function resourceUri(request: Request, id: string): string {
  const path = request.originalUrl.split('?')[0]?.replace(/\/$/, '') ?? '';
  return `${request.protocol}://${request.get('host')}${path}/${encodeURIComponent(id)}`;
}
