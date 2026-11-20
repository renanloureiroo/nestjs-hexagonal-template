import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { noCodeComments } from './eslint/no-code-comments.ts';
import { noSpecReference } from './eslint/no-spec-reference.ts';

/**
 * Pacotes que não podem atravessar a fronteira do núcleo. O núcleo conhece apenas TypeScript e a
 * biblioteca padrão do Node.
 */
const FRAMEWORK_IMPORTS = [
  { group: ['@nestjs/*'], message: 'O núcleo não conhece Nest.' },
  { group: ['drizzle-orm', 'drizzle-orm/*', 'pg'], message: 'O núcleo não conhece persistência.' },
  { group: ['class-validator', 'class-transformer'], message: 'Validação de borda mora em infra.' },
  {
    group: ['express', 'jose', '@opentelemetry/*'],
    message: 'O núcleo não conhece protocolo, token ou telemetria.',
  },
  {
    group: ['**/infra/**'],
    message: 'A dependência aponta de infra para o núcleo, nunca o contrário.',
  },
];

/**
 * Regras locais do projeto. As regras rodam com o Node, que remove os tipos dos arquivos `.ts`
 * sem etapa de build.
 */
const project = {
  rules: { 'no-code-comments': noCodeComments, 'no-spec-reference': noSpecReference },
};

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'drizzle/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    plugins: { project },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'project/no-code-comments': 'error',
      'project/no-spec-reference': 'error',
    },
  },
  {
    files: ['test/eslint/no-spec-reference.test.ts'],
    rules: { 'project/no-spec-reference': 'off' },
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
