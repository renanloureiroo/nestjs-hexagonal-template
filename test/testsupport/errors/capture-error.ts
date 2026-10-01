// Captura o erro lançado para que o teste afirme `type` e `code`, nunca a mensagem.
export function captureError(work: () => unknown): unknown {
  try {
    work();
  } catch (error) {
    return error;
  }
  throw new Error('Era esperado que a operação lançasse um erro');
}
