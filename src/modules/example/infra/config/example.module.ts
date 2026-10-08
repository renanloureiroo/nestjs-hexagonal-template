import { Module } from '@nestjs/common';
import { DomainEventPublisher } from '../../../../core/event/domain-event-publisher.js';
import { Transactor } from '../../../../core/transaction/transactor.js';
import { withTransactions } from '../../../../infra/transaction/with-transactions.js';
import { NoteRepository } from '../../application/repositories/note-repository.js';
import { CreateNoteUseCase } from '../../application/usecases/create-note.use-case.js';
import { GetNoteUseCase } from '../../application/usecases/get-note.use-case.js';
import { ListNotesUseCase } from '../../application/usecases/list-notes.use-case.js';
import { NoteRepositoryDrizzle } from '../database/drizzle/repositories/note-repository-drizzle.js';
import { NoteCreatedListener } from '../events/note-created.listener.js';
import { NoteController } from '../http/controllers/note.controller.js';

// Cabeamento explícito, no papel do UseCasesConfiguration com @Bean: os casos de uso são
// classes puras, sem @Injectable.
@Module({
  controllers: [NoteController],
  providers: [
    { provide: NoteRepository, useClass: NoteRepositoryDrizzle },
    NoteCreatedListener,
    {
      provide: CreateNoteUseCase,
      inject: [NoteRepository, DomainEventPublisher, Transactor],
      useFactory: (notes: NoteRepository, events: DomainEventPublisher, transactor: Transactor) =>
        withTransactions(new CreateNoteUseCase(notes, events), transactor),
    },
    {
      provide: GetNoteUseCase,
      inject: [NoteRepository],
      useFactory: (notes: NoteRepository) => new GetNoteUseCase(notes),
    },
    {
      provide: ListNotesUseCase,
      inject: [NoteRepository],
      useFactory: (notes: NoteRepository) => new ListNotesUseCase(notes),
    },
  ],
})
export class ExampleModule {}
