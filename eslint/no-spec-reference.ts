import type { Rule } from 'eslint';

/**
 * Identificadores de rastreabilidade: requisitos e critérios das specs (`FR-008`, `SC-001`), ADRs
 * (`ADR 0006`) e caminhos de spec (`specs/001-...`). Decisões de pesquisa (`R4`) ficam de fora por
 * serem curtas demais para distinguir de texto comum.
 */
const SPEC_REFERENCE = /\b(?:FR|SC|NFR)-\d{3}\b|\bADR\s?\d{4}\b|\bspecs\/\d{3}-/;

/**
 * Proíbe referência a spec, requisito ou ADR em strings e templates: elas só podem aparecer em
 * JSDoc. Comentários comuns já são barrados por `project/no-code-comments`.
 *
 * @see docs/adr/0001-documentar-o-codigo-so-com-jsdoc.md
 */
export const noSpecReference: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Restringe referências a spec, requisito ou ADR ao JSDoc.' },
    schema: [],
    messages: {
      specReference:
        'Referência a spec, requisito ou ADR só pode aparecer em JSDoc (@see), não em código, nome de teste ou mensagem.',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string' && SPEC_REFERENCE.test(node.value)) {
          context.report({ node, messageId: 'specReference' });
        }
      },
      TemplateElement(node) {
        if (SPEC_REFERENCE.test(node.value.raw)) {
          context.report({ node, messageId: 'specReference' });
        }
      },
    };
  },
};
