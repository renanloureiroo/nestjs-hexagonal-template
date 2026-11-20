# 0001. Documentar o código só com JSDoc

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro
- **Relacionados:** regras `project/no-code-comments` e `project/no-spec-reference` em `eslint/`

## Contexto

Comentários `//` soltos no meio do código envelhecem sem ninguém perceber: o código muda, o
comentário fica, e o leitor (pessoa ou agente) passa a confiar numa explicação falsa. Nos serviços
que nasceram deste template, a regra "comentários explicam decisões" virou dezenas de comentários
espalhados dentro de corpos de função, com referências a specs e ADRs que ninguém atualizava.

## Decisão

O código não tem comentários `//` nem `/* */`. A única documentação no código é o JSDoc (`/** */`)
imediatamente antes de uma declaração: classe, função, método, propriedade, tipo, constante. O que
um comentário dentro de um corpo explicaria vira nome, constante, tipo, teste ou JSDoc da
declaração; o porquê de uma decisão vai para um ADR ou para o commit.

Referências a spec, requisito ou ADR (`FR-008`, `ADR 0006`, `specs/001-...`) só aparecem em JSDoc,
em geral como `@see`, nunca em strings, mensagens ou nomes de teste.

As exceções são as diretivas de ferramenta com motivo: `// eslint-disable-next-line regra -- motivo`
e `// @ts-expect-error motivo`.

Duas regras locais do ESLint, em `eslint/`, cobram isso no `npm run verify`.

## Alternativas consideradas

### Só JSDoc, cobrado pelo lint (escolhida)

- **Prós:** a documentação fica presa à declaração que ela descreve e aparece no editor; o lint
  impede a volta dos comentários soltos.
- **Contras:** um porquê pontual dentro de um corpo exige extrair uma função ou constante nomeada.

### Comentários livres, por convenção

- **Prós:** nenhum atrito.
- **Contras:** é o que existia, e a convenção não se sustentou.

## Consequências

- Explicações que antes ficavam no meio de um método sobem para o JSDoc do método ou viram nomes.
- Arquivos de configuração (`vitest.config.ts`, `drizzle.config.ts`) seguem a mesma regra.
- O `Dockerfile`, o YAML e o Markdown não são TypeScript e continuam com comentários `#`.
