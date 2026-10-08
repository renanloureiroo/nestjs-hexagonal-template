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

// Semântica de @Min sobre inteiro: ausência passa; texto, fração ou NaN não passam.
export function IntMin(min: number, message: string): PropertyDecorator {
  return ValidateBy(
    {
      name: 'intMin',
      constraints: [min],
      validator: {
        validate: (value: unknown) =>
          value === undefined || (Number.isInteger(value) && (value as number) >= min),
      },
    },
    { message },
  );
}

// Semântica de @Max sobre inteiro, com as mesmas regras de ausência de IntMin.
export function IntMax(max: number, message: string): PropertyDecorator {
  return ValidateBy(
    {
      name: 'intMax',
      constraints: [max],
      validator: {
        validate: (value: unknown) =>
          value === undefined || (Number.isInteger(value) && (value as number) <= max),
      },
    },
    { message },
  );
}
