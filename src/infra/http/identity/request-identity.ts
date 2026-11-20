/** Quem fez a requisição, segundo o mecanismo de identidade configurado. */
export interface RequestIdentity {
  /** Identificador estável da pessoa no provedor de identidade (o `sub` do token). */
  readonly subject: string;
  /**
   * Claims do token quando a API valida o JWT; vazio no modo gateway, que só repassa o sujeito. Um
   * claim só vira regra de negócio depois de lido por um adaptador, nunca direto no caso de uso.
   */
  readonly claims: Readonly<Record<string, unknown>>;
}
