import { Injectable } from '@nestjs/common';
import { Transactor } from '../../core/transaction/transactor.js';
import { Database } from './database.js';

@Injectable()
export class DrizzleTransactor extends Transactor {
  constructor(private readonly database: Database) {
    super();
  }

  inTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.database.transaction(work);
  }
}
