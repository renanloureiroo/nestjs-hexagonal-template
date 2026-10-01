export interface DomainEvent {
  // Nome estável usado para roteamento; não depende do nome da classe após minificação.
  readonly name: string;
  readonly occurredAt: Date;
}
