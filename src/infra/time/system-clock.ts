import { Injectable } from '@nestjs/common';
import { Clock } from '../../core/time/clock.js';

@Injectable()
export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
