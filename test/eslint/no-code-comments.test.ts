import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { noCodeComments } from '../../eslint/no-code-comments.js';

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

describe('noCodeComments', () => {
  ruleTester.run('no-code-comments', noCodeComments, {
    valid: [
      { name: 'código sem comentários', code: 'const answer = 42;' },
      { name: 'JSDoc antes de constante', code: '/** Resposta. */\nconst answer = 42;' },
      { name: 'JSDoc antes de export', code: '/** Resposta. */\nexport const answer = 42;' },
      {
        name: 'JSDoc antes de função',
        code: '/** Soma. */\nfunction sum(a: number, b: number) { return a + b; }',
      },
      {
        name: 'JSDoc antes de classe decorada',
        code: '/** Módulo. */\n@Module({})\nexport class AppModule {}',
      },
      {
        name: 'JSDoc antes de método e propriedade',
        code: 'class A {\n  /** Valor. */\n  readonly value = 1;\n  /** Executa. */\n  run() {}\n}',
      },
      {
        name: 'JSDoc antes de membro abstrato',
        code: 'abstract class Port {\n  /** Salva. */\n  abstract save(): Promise<void>;\n}',
      },
      {
        name: 'JSDoc antes de interface, tipo e membro',
        code: '/** Entrada. */\ninterface Input {\n  /** Nome. */\n  readonly name: string;\n}\n/** Saída. */\ntype Output = string;',
      },
      {
        name: 'JSDoc antes de propriedade de objeto',
        code: 'const config = {\n  /** Pasta. */\n  out: "drizzle",\n};',
      },
      {
        name: 'diretiva do ESLint com motivo',
        code: '// eslint-disable-next-line no-console -- saída do script de linha de comando\nconsole.log(1);',
      },
      {
        name: 'diretiva de bloco do ESLint com motivo',
        code: '/* eslint-disable no-console -- script */\nconsole.log(1);',
      },
      {
        name: '@ts-expect-error com motivo',
        code: '// @ts-expect-error tipo da biblioteca está errado\nconst x: number = "a";',
      },
      { name: 'shebang', code: '#!/usr/bin/env node\nconst a = 1;' },
    ],
    invalid: [
      {
        name: 'comentário de linha',
        code: '// explica\nconst a = 1;',
        errors: [{ messageId: 'comment' }],
      },
      {
        name: 'comentário no fim da linha',
        code: 'const a = 1; // explica',
        errors: [{ messageId: 'comment' }],
      },
      {
        name: 'comentário de bloco',
        code: '/* explica */\nconst a = 1;',
        errors: [{ messageId: 'comment' }],
      },
      {
        name: 'diretiva do ESLint sem motivo',
        code: '// eslint-disable-next-line no-console\nconsole.log(1);',
        errors: [{ messageId: 'comment' }],
      },
      {
        name: '@ts-expect-error sem motivo',
        code: '// @ts-expect-error\nconst x: number = "a";',
        errors: [{ messageId: 'comment' }],
      },
      {
        name: '@ts-ignore',
        code: '// @ts-ignore porque sim\nconst x: number = "a";',
        errors: [{ messageId: 'comment' }],
      },
      {
        name: 'JSDoc dentro de corpo de função',
        code: 'function f() {\n  /** passo */\n  return 1;\n}',
        errors: [{ messageId: 'detachedJsdoc' }],
      },
      {
        name: 'JSDoc antes de chamada',
        code: '/** suíte */\ndescribe("x", () => {});',
        errors: [{ messageId: 'detachedJsdoc' }],
      },
      {
        name: 'JSDoc seguido de outro comentário',
        code: '/** doc */\n// solto\nconst a = 1;',
        errors: [{ messageId: 'detachedJsdoc' }, { messageId: 'comment' }],
      },
      {
        name: 'JSDoc no fim do arquivo',
        code: 'const a = 1;\n/** sobra */',
        errors: [{ messageId: 'detachedJsdoc' }],
      },
    ],
  });
});
