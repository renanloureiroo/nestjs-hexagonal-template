import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Pacotes que não podem atravessar a fronteira do núcleo. O núcleo conhece apenas
// TypeScript e a biblioteca padrão do Node.
const FRAMEWORK_IMPORTS = [
  { group: ['@nestjs/*'], message: 'O núcleo não conhece Nest.' },
  { group: ['drizzle-orm', 'drizzle-orm/*', 'pg'], message: 'O núcleo não conhece persistência.' },
  { group: ['class-validator', 'class-transformer'], message: 'Validação de borda mora em infra.' },
  {
    group: ['express', '@opentelemetry/*'],
    message: 'O núcleo não conhece protocolo ou telemetria.',
  },
  {
    group: ['**/infra/**'],
    message: 'A dependência aponta de infra para o núcleo, nunca o contrário.',
  },
];

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'drizzle/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: [
      'src/core/**/*.ts',
      'src/modules/*/domain/**/*.ts',
      'src/modules/*/application/**/*.ts',
    ],
    rules: { 'no-restricted-imports': ['error', { patterns: FRAMEWORK_IMPORTS }] },
  },
);
