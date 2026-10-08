import { Transform } from 'class-transformer';

// Query string chega como texto. Converte só o que parece número: vazio e texto livre seguem
// como estão, para a constraint rejeitar com a mensagem do campo em vez de virar 0 ou NaN calado.
export function QueryNumber(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))
      ? Number(value)
      : value,
  );
}
