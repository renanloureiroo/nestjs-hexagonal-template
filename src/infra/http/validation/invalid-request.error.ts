// Falha de validação da borda. Não é ApplicationError: o núcleo nunca a vê.
export class InvalidRequestError extends Error {
  constructor(readonly fields: Record<string, string>) {
    super('Requisição inválida');
    this.name = InvalidRequestError.name;
  }
}
