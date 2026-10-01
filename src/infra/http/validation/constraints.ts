import { ValidateBy } from 'class-validator';

// Semântica de @NotBlank: rejeita ausência, vazio, apenas espaços e valores que não são texto.
export function NotBlank(message: string): PropertyDecorator {
  return ValidateBy(
    {
      name: 'notBlank',
      validator: {
        validate: (value: unknown) => typeof value === 'string' && value.trim() !== '',
      },
    },
    { message },
  );
}

// Semântica de @Size(max): ausência não é responsabilidade desta constraint.
export function MaxChars(max: number, message: string): PropertyDecorator {
  return ValidateBy(
    {
      name: 'maxChars',
      constraints: [max],
      validator: {
        validate: (value: unknown) => typeof value !== 'string' || value.length <= max,
      },
    },
    { message },
  );
}
