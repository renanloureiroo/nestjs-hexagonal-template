import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { type Counter, metrics } from '@opentelemetry/api';
import { NoteCreated } from '../../domain/events/note-created.js';

@Injectable()
export class NoteCreatedListener {
  static readonly METRIC_NAME = 'example.notes.created';

  private readonly logger = new Logger(NoteCreatedListener.name);
  private readonly createdNotes: Counter = metrics
    .getMeter('example')
    .createCounter(NoteCreatedListener.METRIC_NAME);

  // Executado somente após o commit da transação que criou a nota.
  @OnEvent(NoteCreated.NAME, { async: true, promisify: true })
  on(event: NoteCreated): void {
    this.createdNotes.add(1);
    this.logger.log(`Evento NoteCreated processado [${event.noteId}]`);
  }
}
