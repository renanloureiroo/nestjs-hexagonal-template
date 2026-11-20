import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { noSpecReference } from '../../eslint/no-spec-reference.js';

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

describe('noSpecReference', () => {
  ruleTester.run('no-spec-reference', noSpecReference, {
    valid: [
      { name: 'referência em JSDoc', code: '/** @see FR-008 e ADR 0006 */\nconst a = 1;' },
      { name: 'texto comum', code: 'const message = "Fuso inválido";' },
      { name: 'código de erro', code: 'const code = "profiles.time_zone_invalid";' },
      { name: 'número sem prefixo de spec', code: 'const year = "ADR-like 2026";' },
    ],
    invalid: [
      {
        name: 'requisito em string',
        code: 'it("cumpre FR-008", () => {});',
        errors: [{ messageId: 'specReference' }],
      },
      {
        name: 'critério em template',
        code: 'const m = `ver SC-001 ${x}`;',
        errors: [{ messageId: 'specReference' }],
      },
      {
        name: 'ADR em mensagem',
        code: 'throw new Error("segue ADR 0006");',
        errors: [{ messageId: 'specReference' }],
      },
      {
        name: 'caminho de spec',
        code: 'const p = "specs/001-criar-nota";',
        errors: [{ messageId: 'specReference' }],
      },
    ],
  });
});
