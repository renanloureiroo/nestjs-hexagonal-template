import type { Rule, SourceCode } from 'eslint';
import type { Comment } from 'estree';

/**
 * Nós que podem receber JSDoc. O comentário precisa vir imediatamente antes de um deles; em
 * qualquer outro lugar (dentro de um corpo de função, antes de uma chamada) ele é um comentário
 * solto.
 */
const DOCUMENTABLE = new Set<string>([
  'ClassDeclaration',
  'ExportDefaultDeclaration',
  'ExportNamedDeclaration',
  'FunctionDeclaration',
  'MethodDefinition',
  'Property',
  'PropertyDefinition',
  'TSAbstractMethodDefinition',
  'TSAbstractPropertyDefinition',
  'TSDeclareFunction',
  'TSEnumDeclaration',
  'TSEnumMember',
  'TSInterfaceDeclaration',
  'TSMethodSignature',
  'TSModuleDeclaration',
  'TSPropertySignature',
  'TSTypeAliasDeclaration',
  'VariableDeclaration',
]);

/** Diretiva do ESLint com justificativa obrigatória depois de ` -- `. */
const ESLINT_DIRECTIVE = /^\s*eslint-(?:disable|enable)(?:-next-line|-line)?\b.*\s--\s+\S/;

/** `@ts-expect-error` seguido do motivo. `@ts-ignore` não é aceito. */
const TS_DIRECTIVE = /^\s*@ts-expect-error\s+\S/;

/**
 * Proíbe comentários `//` e `/* *\/`, aceitando apenas JSDoc ligado a uma declaração e as
 * diretivas de ferramenta com motivo.
 *
 * @see docs/adr/0001-documentar-o-codigo-so-com-jsdoc.md
 */
export const noCodeComments: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Proíbe comentários fora de JSDoc ligado a uma declaração.' },
    schema: [],
    messages: {
      comment:
        'Comentário não é permitido: documente a declaração com JSDoc (/** */) ou expresse a intenção no código.',
      detachedJsdoc: 'JSDoc precisa vir imediatamente antes de uma declaração.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const documented = new Set<number>();
    const listener: Rule.RuleListener = {
      'Program:exit'() {
        for (const comment of sourceCode.getAllComments()) {
          const verdict = judge(comment, documented);
          if (verdict !== 'allowed' && comment.loc) {
            context.report({ loc: comment.loc, messageId: verdict });
          }
        }
      },
    };
    for (const type of DOCUMENTABLE) {
      listener[type] = (node: Rule.Node) => markLeadingJsdoc(node, sourceCode, documented);
    }
    return listener;
  },
};

function judge(comment: Comment, documented: ReadonlySet<number>): Verdict {
  if ((comment.type as string) === 'Shebang') {
    return 'allowed';
  }
  if (comment.type === 'Line') {
    return ESLINT_DIRECTIVE.test(comment.value) || TS_DIRECTIVE.test(comment.value)
      ? 'allowed'
      : 'comment';
  }
  if (comment.value.startsWith('*')) {
    return comment.range && documented.has(comment.range[0]) ? 'allowed' : 'detachedJsdoc';
  }
  return ESLINT_DIRECTIVE.test(comment.value) ? 'allowed' : 'comment';
}

type Verdict = 'allowed' | 'comment' | 'detachedJsdoc';

/**
 * Marca o JSDoc imediatamente anterior ao nó, sem token nem outro comentário no meio. Decorators
 * contam como parte do nó: em `@Module() export class`, o JSDoc vem antes do `@`, que fica fora do
 * intervalo do `export`.
 */
function markLeadingJsdoc(node: Rule.Node, sourceCode: SourceCode, documented: Set<number>): void {
  const start = Math.min(node.range?.[0] ?? Infinity, ...decoratorStarts(node));
  const token = sourceCode.getTokenByRangeStart(start);
  if (!token) {
    return;
  }
  const leading = sourceCode.getCommentsBefore(token).at(-1);
  if (leading?.type === 'Block' && leading.value.startsWith('*') && leading.range) {
    documented.add(leading.range[0]);
  }
}

function decoratorStarts(node: Rule.Node): number[] {
  const own = (node as { decorators?: Decorated[] }).decorators ?? [];
  const declared =
    (node as { declaration?: { decorators?: Decorated[] } }).declaration?.decorators ?? [];
  return [...own, ...declared].map((decorator) => decorator.range[0]);
}

interface Decorated {
  readonly range: [number, number];
}
