import { Clock } from '../../../src/core/time/clock.js';

/** Relógio de teste: começa no instante dado e só anda quando o teste manda. */
export class FixedClock extends Clock {
  private current: Date;

  constructor(start: Date | string = '2026-01-01T12:00:00.000Z') {
    super();
    this.current = new Date(start);
  }

  now(): Date {
    return new Date(this.current);
  }

  set(instant: Date | string): void {
    this.current = new Date(instant);
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
