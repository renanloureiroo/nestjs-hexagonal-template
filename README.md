# NestJS Hexagonal Template

Template de backend Node.js 24 com NestJS, arquitetura modular, PostgreSQL,
Drizzle, OpenTelemetry, Vitest e Testcontainers.

<!-- template:start -->

É a versão Node.js do
[spring-boot-hexagonal-template](https://github.com/renanloureiroo/spring-boot-hexagonal-template):
mesma arquitetura, mesmos contratos de erro (RFC 9457 com `code` estável) e mesmos
tipos de teste.

<!-- template:end -->

O módulo `example` implementa uma API pequena de notas para mostrar o caminho
completo: domínio → caso de uso → porta → Drizzle → HTTP. Ele deve ser removido ou
renomeado quando o primeiro contexto real for criado.

## Requisitos

- Node.js 24 (`nvm use`);
- Docker;
- Docker Compose.

## Rodando localmente

Crie a configuração local a partir do exemplo:

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` sobe o `compose.yaml` (PostgreSQL e Grafana LGTM) e inicia a
aplicação em modo watch. As migrations são aplicadas no boot. A aplicação fica
disponível em:

- API: `http://localhost:8080/api`;
- Swagger UI: `http://localhost:8080/api/swagger-ui`;
- OpenAPI JSON: `http://localhost:8080/api/v3/api-docs`;
- Health: `http://localhost:8080/api/health`;
- Grafana: `http://localhost:3000`.

Exemplo:

```bash
curl -i -X POST http://localhost:8080/api/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"Minha primeira nota"}'
```

## Testes

```bash
npm test
npm run verify
npm run test:unit
npm run test:e2e
```

Os testes E2E exigem Docker e são ignorados quando ele não está disponível. Veja
[docs/TESTS.md](docs/TESTS.md).

## Migrations

Depois de alterar um arquivo `*.schema.ts`:

```bash
npm run db:generate -- --name descricao_da_mudanca
```

O arquivo gerado em `drizzle/` é versionado e nunca editado depois de aplicado.

## Imagem da aplicação

```bash
docker build -t nestjs-hexagonal-template .
```

A imagem lê `DATABASE_URL`, `PORT`, `API_DOCS_ENABLED`, `LOG_LEVEL` e as variáveis
`OTEL_*` do ambiente.

<!-- template:start -->

## Usando como template

Clique em **Use this template** e dê ao repositório o nome do projeto, por exemplo
`orders-service`. No primeiro push, o workflow `template-init` renomeia tudo a
partir desse nome e commita o resultado:

| Item                              | Exemplo para `orders-service` |
| --------------------------------- | ----------------------------- |
| `name` do `package.json` e imagem | `orders-service`              |
| `OTEL_SERVICE_NAME`               | `orders-service`              |
| Banco e usuário locais            | `orders_service`              |
| Título da API                     | `Orders Service API`          |

Aguarde o workflow terminar (aba **Actions**, cerca de 30 s) antes de clonar.

Para inicializar localmente, depois de clonar:

```bash
scripts/init-template.sh orders-service
```

Depois da inicialização:

1. ajuste `description` no `package.json`;
2. remova ou renomeie `src/modules/example`, `test/modules/example` e sua migration;
3. substitua este README pela apresentação do produto;
4. revise as decisões abertas em `docs/ARCHITECTURE.md`.

<!-- template:end -->

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Testes](docs/TESTS.md)
