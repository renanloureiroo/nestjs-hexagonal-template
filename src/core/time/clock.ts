/**
 * Porta do relógio. Casos de uso e jobs nunca chamam `new Date()`: recebem o relógio, e o teste
 * decide que horas são.
 */
export abstract class Clock {
  abstract now(): Date;
}
