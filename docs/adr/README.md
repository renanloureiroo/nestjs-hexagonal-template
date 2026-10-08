# Registros de decisão de arquitetura (ADRs)

Um ADR registra uma decisão de arquitetura com custo duradouro: o contexto em que ela foi tomada,
as alternativas descartadas e as consequências aceitas. O [ARCHITECTURE.md](../ARCHITECTURE.md)
diz como o backend é; os ADRs dizem por que ele ficou assim.

## Quando escrever

Um ADR é necessário quando a decisão:

- é cara de desfazer (autenticação, banco de dados, ORM, formato de contrato público, estratégia de
  eventos externos);
- tinha alternativas razoáveis que alguém vai propor de novo;
- muda uma regra de [ARCHITECTURE.md](../ARCHITECTURE.md) ou [TESTS.md](../TESTS.md);
- resolve uma das decisões ainda abertas listadas no fim de [ARCHITECTURE.md](../ARCHITECTURE.md).

Não precisam de ADR escolhas locais e reversíveis dentro de um pull request, convenções de nome
ou atualização de versão de dependência.

## Como escrever

1. Copie [`0000-template.md`](0000-template.md) para `NNNN-titulo-curto.md`, com o próximo número
   livre em quatro dígitos e o título em `kebab-case`
   (`0001-publicar-eventos-externos-por-outbox.md`).
2. Preencha com status **Proposto** e abra o pull request com o ADR e a mudança que ele justifica.
3. No merge, mude o status para **Aceito**, acrescente a linha no índice abaixo e atualize
   [ARCHITECTURE.md](../ARCHITECTURE.md) se a decisão mudar uma regra.

Um ADR aceito não é reescrito. Quando a decisão muda, um ADR novo explica o porquê e referencia o
anterior; no antigo, só o status muda para **Substituído por NNNN**.

## Status

| Status               | Significado                                                           |
| -------------------- | --------------------------------------------------------------------- |
| Proposto             | em discussão no pull request                                          |
| Aceito               | vale para o código atual                                              |
| Rejeitado            | discutido e descartado; fica registrado para não voltar sem fato novo |
| Substituído por NNNN | outra decisão tomou o lugar desta                                     |
| Descontinuado        | deixou de valer sem substituta                                        |

## Índice

| ADR | Título                            | Status |
| --- | --------------------------------- | ------ |
| —   | Nenhuma decisão registrada ainda. | —      |
