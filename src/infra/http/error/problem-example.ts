import { type ProblemDetailDTO } from './problem-detail.dto.js';

const STATUS_TITLES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
};

// Exemplo RFC 9457 por resposta no OpenAPI: cada status mostra o code que ele realmente produz.
export function problemExample(
  example: Pick<ProblemDetailDTO, 'status' | 'detail' | 'instance' | 'code' | 'errors'>,
): ProblemDetailDTO {
  return {
    title: STATUS_TITLES[example.status] ?? 'Error',
    ...example,
    traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  };
}
