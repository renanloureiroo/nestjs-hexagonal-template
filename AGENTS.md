# AGENTS.md

Backend Node.js 24 com NestJS, PostgreSQL, Drizzle, OpenTelemetry, Vitest e
Testcontainers. Projeto ESM: imports relativos terminam em `.js`.

A dependência aponta em uma única direção: `infra` conhece `application` e
`domain`; o núcleo não conhece Nest, HTTP ou Drizzle.

Antes de alterar código, leia:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/TESTS.md`](docs/TESTS.md)

Regras essenciais:

- casos de uso são classes puras cabeadas por `useFactory` no módulo do contexto;
- invariantes vivem no domínio;
- persistência usa porta, adaptador e schema Drizzle separado;
- portas são classes abstratas; fakes as estendem;
- mocks sobre portas do projeto são proibidos;
- erros HTTP seguem RFC 9457 e carregam `code` estável;
- migrations aplicadas nunca são editadas;
- o portão de entrega é `npm run verify`.
