# Testes do backend

Este documento define como provar o comportamento de um backend criado a partir deste template.
Ele complementa [ARCHITECTURE.md](ARCHITECTURE.md): a arquitetura descreve as
fronteiras; este documento define o teste adequado para cada uma.

O objetivo não é maximizar cobertura por métrica. É manter contratos observáveis,
invariantes de domínio e integrações críticas protegidos com o teste mais barato
capaz de demonstrar cada comportamento.

---

## 1. Princípios

### Fakes para portas do projeto

Mock sobre uma porta do projeto é proibido: nada de `vi.fn()`, `vi.mock()` ou
`vi.spyOn()` sobre repositórios, gateways, publisher de eventos ou transactor.
Essas portas possuem implementações de teste reais em `test/testsupport`.

Um caso de uso deve ser testado pelo estado resultante no fake, não por
`expect(repository.save).toHaveBeenCalled()`. Isso prova o comportamento e mantém o
teste estável quando a implementação interna muda.

Mock é aceitável apenas para a fronteira de uma biblioteca de terceiro quando um
fake real custaria mais do que a integração que está sendo verificada.

### Contrato do erro

Testes de domínio e aplicação afirmam classe, `type` e `code`, nunca a mensagem:

```ts
const error = captureError(() => Value.of(invalid));

expect(error).toBeInstanceOf(DomainError);
expect(error).toMatchObject({ type: ErrorType.VALIDATION, code: 'context.value_invalid' });
```

Para operações assíncronas:

```ts
await expect(sut.execute(input)).rejects.toMatchObject({ code: 'context.not_found' });
```

A mensagem exata só é contrato em dois lugares:

- teste do DTO, para provar que a constraint espelha o domínio;
- E2E, para provar o que o cliente efetivamente recebe.

### Teste mais barato primeiro

A aplicação Nest só sobe quando a integração entre as peças é o objeto do teste.
Combinações de entrada, limites e invariantes pertencem a testes unitários rápidos.

## 2. Tipos de teste

| Tipo                    | Aplicação Nest             | Ferramenta                                 | O que prova                 |
| ----------------------- | -------------------------- | ------------------------------------------ | --------------------------- |
| Value object / entidade | não                        | Vitest                                     | invariantes e transições    |
| Caso de uso             | não                        | Vitest + fake in-memory                    | orquestração e estado final |
| DTO / validação         | não                        | `plainToInstance` + `validateSync`         | constraints e `toInput()`   |
| Componente HTTP isolado | módulo de teste, sem banco | `@nestjs/testing` + Supertest              | tradução na borda           |
| Adaptador               | não                        | colaborador de teste                       | protocolo de integração     |
| E2E                     | completa                   | `describeE2E` + Testcontainers + Supertest | contrato HTTP ponta a ponta |

Testes E2E iniciam a aplicação com `app.listen(0)`. Isso usa um servidor real em
uma porta livre e exercita serialização, validação, transação e persistência como
ocorrerão em produção.

## 3. Estrutura

A árvore `test/` espelha a de `src/` e concentra utilidades compartilhadas em
`testsupport`:

```text
test
├── core
├── infra
├── modules
│   └── <contexto>
│       ├── domain
│       ├── application
│       └── infra
└── testsupport
    ├── database/database-cleaner.ts
    ├── e2e/e2e.ts
    ├── e2e/global-setup.ts
    ├── errors/capture-error.ts
    ├── events
    ├── factories
    ├── gateways
    ├── repositories
    ├── telemetry/metrics.ts
    └── transaction/direct-transactor.ts
```

O Vitest tem dois projetos em `vitest.config.ts`:

| Projeto | Arquivos                        | Execução                                    |
| ------- | ------------------------------- | ------------------------------------------- |
| `unit`  | `test/**/*.test.ts`, exceto E2E | paralelo, isolado, sem Docker               |
| `e2e`   | `test/**/*.e2e.test.ts`         | um worker, sem isolamento, depois do `unit` |

## 4. Convenções

- arquivo: `<alvo>.test.ts`; ponta a ponta: `<alvo>.e2e.test.ts`;
- `describe` com o nome do alvo; `it` em português descrevendo comportamento;
- sujeito sob teste chamado `sut` quando montado no `beforeEach`;
- `globals: true`: `describe`, `it`, `expect` e hooks sem import;
- famílias de entrada em `it.each`;
- montagem, ação e asserção separadas por linha em branco;
- sem comentários `given/when/then` que apenas repitam a estrutura;
- nenhum `it.skip`, `it.only` ou `it.todo` sem justificativa escrita.

Use `it.each([null, undefined, '', '   '])` para cobrir o quarteto de ausência.
`null` e `undefined` chegam ao domínio quando o dado vem de JSON, apesar do tipo.

## 5. Value objects

Todo caminho de construção é exercitado sem Nest:

- formatos válidos;
- formatos inválidos;
- ausência;
- os dois lados de cada limite;
- `type` e `code` de cada erro;
- igualdade estrutural por `equals`;
- `toString()` quando ele representa o valor externo;
- derivação e normalização, quando existirem.

```ts
it.each([null, undefined, '', '   '])('rejeita valor ausente: %j', (invalid) => {
  const error = captureError(() => Value.of(invalid as string));

  expect(error).toMatchObject({ code: 'context.value_invalid' });
});

it('respeita o limite máximo', () => {
  expect(Value.of('a'.repeat(200)).value).toHaveLength(200);

  expect(captureError(() => Value.of('a'.repeat(201)))).toBeInstanceOf(DomainError);
});
```

O mesmo teste deve mostrar que 200 passa e 201 falha; testar apenas o lado
inválido não demonstra qual é o limite.

## 6. Entidades

Teste comportamento e transição, não getters isolados:

- estado ao nascer por `create`;
- identidade própria;
- cada método de negócio e seu efeito;
- atualização de `updatedAt`;
- rejeição de transições inválidas;
- preservação de identidade e timestamps por `restore`;
- igualdade por tipo concreto e identificador.

Quando a classe usa o relógio do sistema, evite igualdade com um instante exato.
Capture o instante anterior e afirme `toBeGreaterThanOrEqual`, ou introduza uma
porta de relógio apenas quando o domínio exigir controle determinístico do tempo.
`vi.useFakeTimers()` não substitui essa porta.

## 7. Casos de uso

O setup usa fakes reais:

```ts
let resources: InMemoryResourceRepository;
let sut: CreateResourceUseCase;

beforeEach(() => {
  resources = new InMemoryResourceRepository();
  sut = new CreateResourceUseCase(resources);
});
```

Cada caso de uso cobre:

- caminho feliz completo;
- variações de entrada que alteram o resultado;
- cada erro que pode lançar;
- dado carregado por um erro nomeado;
- estado final no fake;
- ausência de mudança em todos os caminhos de falha;
- passagem pelo `DirectTransactor`, quando houver transação programática.

```ts
it('não altera o estado quando a regra falha', async () => {
  const existing = await ResourceFactory.aResource().buildSavedIn(resources);

  await expect(sut.execute(duplicatedInput())).rejects.toBeInstanceOf(ResourceAlreadyExistsError);

  expect(resources.findAll()).toEqual([existing]);
});
```

`@Transactional()` não tem efeito quando o caso de uso é instanciado diretamente;
a marca só é aplicada por `withTransactions`, testado separadamente.

## 8. Factories e fakes

Cada agregado possui uma factory fluente com defaults válidos e, quando fizer
sentido:

```ts
ResourceFactory.aResource().build();
ResourceFactory.aResource().withName('Outro').build();
await ResourceFactory.aResource().buildSavedIn(resources);
ResourceFactory.aResource().asCreateInput();
ResourceFactory.aResource().asRequest();
```

Construção manual repetida é proibida. Quando um campo obrigatório for adicionado,
o default deve mudar em um único lugar.

Fakes in-memory estendem a porta (classe abstrata) e preservam comportamento
relevante dela, como unicidade, paginação e ordem. Eles não simulam SQL; o que
depende do banco é provado pelo E2E.

## 9. DTOs e validação

DTO é testado com `plainToInstance` e `validateSync`, sem aplicação Nest. As
violações são convertidas por `fieldErrorsOf`, a mesma função usada pela borda,
para que o teste veja exatamente o formato que o cliente recebe em `errors`.

O teste verifica:

- payload mínimo e completo válidos;
- cada constraint e sua mensagem exata;
- todos os campos inválidos reportados juntos;
- conversão correta por `toInput()`;
- alinhamento entre mensagem da constraint e invariante do domínio.

```ts
function violationsOf(payload: object): Record<string, string> {
  return fieldErrorsOf(validateSync(plainToInstance(CreateResourceRequestDTO, payload)));
}
```

## 10. Componentes de borda e adaptadores

O `ApiExceptionFilter` é testado com `Test.createTestingModule`, um controller de
teste que lança os erros necessários e Supertest, sem banco. O provedor de
`traceId` é injetado pelo construtor do filtro. Deve ser provado que:

- cada `ErrorType` recebe o status esperado;
- a resposta segue RFC 9457;
- `code` e `traceId` aparecem quando aplicável;
- erro inesperado vira `internal.unexpected`;
- JSON malformado vira `request.invalid` sem a mensagem do parser;
- mensagens internas e segredos não vazam na resposta.

Adaptadores que conversam com APIs de framework usam colaboradores de teste que
registram eventos. `withTransactions` é provado com o `DirectTransactor`, que
registra as sequências `begin → commit` e `begin → rollback`, além de preservar a
mesma exceção original.

## 11. Infraestrutura E2E

### `describeE2E` e `e2e()`

```ts
describeE2E('/resources', () => {
  let context: E2EContext;

  beforeAll(async () => {
    context = await e2e();
  });

  beforeEach(async () => {
    await context.cleaner.clean();
  });
});
```

`describeE2E` é `describe.skipIf(!dockerAvailable)`: sem Docker, a suíte E2E é
ignorada e o restante continua verde. `e2e()` sobe a aplicação uma única vez por
execução, com `AppModule` e `configureApp` reais, e a reaproveita entre arquivos.
Não se sobrescrevem providers com `overrideProvider` em E2E sem necessidade
comprovada: o objetivo é exercitar a mesma composição de produção.

### Testcontainers

O `globalSetup` do projeto `e2e` sobe um PostgreSQL real em Testcontainers e
publica a URL com `provide`. Migrations são aplicadas pela própria aplicação no
boot, como em produção. Nenhum serviço compartilhado de desenvolvimento ou ambiente
remoto participa da suíte.

Métricas são observadas por um `MetricReader` em memória registrado no
`setupFiles`, sem container de observabilidade. Se a aplicação vier a depender de
outro serviço de infraestrutura, seu container só entra na suíte quando a
dependência também entrar no comportamento de produção.

### `DatabaseCleaner`

Cada teste começa com banco limpo. O cleaner descobre tabelas pelo catálogo do
PostgreSQL e executa `TRUNCATE ... RESTART IDENTITY CASCADE`, sem codificar a
ordem de chaves estrangeiras. O histórico de migrations do Drizzle vive no schema
`drizzle` e não é tocado.

**Nunca envolva um teste E2E em transação para desfazer no final.** A requisição é
atendida pelo servidor, fora do contexto assíncrono do teste; o rollback do teste
não desfaz o commit feito pela aplicação.

## 12. Contrato mínimo de endpoint

Um endpoint só está pronto quando o E2E cobre:

- [ ] caminho feliz: status, corpo e headers;
- [ ] `Location` em criação;
- [ ] estado persistido lido novamente do banco;
- [ ] validação: 400, `request.invalid` e erros por campo;
- [ ] cada erro de negócio anunciado no OpenAPI;
- [ ] `application/problem+json` nos erros;
- [ ] JSON malformado sem vazamento do erro de parsing;
- [ ] ausência de mudança no banco em cada caminho de falha;
- [ ] status anunciados no OpenAPI iguais aos produzidos.

Não use E2E para varrer dezenas de combinações de entrada. O E2E prova que as
peças se integram; value objects e DTOs provam as combinações.

Exemplo de forma do caminho feliz:

```ts
it('cria, retorna location e persiste', async () => {
  const response = await request(context.app.getHttpServer())
    .post('/api/resources')
    .send(ResourceFactory.aResource().asRequest());

  expect(response.status).toBe(201);
  expect(response.headers.location).toMatch(new RegExp(`/api/resources/${response.body.id}$`));
  expect(await persistedResource(response.body.id)).toBeDefined();
});
```

Os nomes `Resource` e `/resources` são apenas exemplos; devem ser substituídos pela
linguagem do primeiro contexto de negócio.

## 13. Ordem de escrita

| Passo | Produção                              | Teste que vem antes                 |
| ----: | ------------------------------------- | ----------------------------------- |
|     1 | value object e entidade               | invariantes e transições            |
|     2 | porta e fake                          | contrato implementável pelo fake    |
|     3 | caso de uso                           | comportamento sobre o fake          |
|     4 | schema, migration e adaptador Drizzle | integração coberta pelo E2E         |
|     5 | DTO                                   | constraints e `toInput()`           |
|     6 | presenter, OpenAPI e controller       | componentes isolados, se necessário |
|     7 | endpoint completo                     | E2E do contrato HTTP                |

Uma correção de bug começa com um teste vermelho que reproduz o defeito.

## 14. Execução

```bash
npm test                                   # unit + e2e
npm run verify                             # portão de entrega
npm run test:unit                          # sem Docker
npm run test:e2e                           # exige Docker
npx vitest run test/modules/example/domain/valueobjects/note-title.test.ts
npm run test:watch                         # unit em modo watch
```

A suíte roda com `TZ=UTC`, definido em `vitest.config.ts`.

O portão antes de merge é `npm run verify`: lint, typecheck, consistência das
migrations, testes e build. Nenhum teste pode ser ignorado para fazer o build
passar.

## 15. Checklist de review

- [ ] Nenhum mock sobre porta do projeto.
- [ ] Erros afirmados por classe, `type` e `code`, não por mensagem.
- [ ] Dados vêm de factories fluentes.
- [ ] Famílias de entrada usam `it.each`.
- [ ] Os dois lados de cada limite estão cobertos.
- [ ] Caminhos de falha provam que o estado não mudou.
- [ ] E2E cobre o contrato mínimo do endpoint.
- [ ] E2E lê o estado de volta do banco.
- [ ] Não existe transação de teste em E2E.
- [ ] Não existe `it.skip` ou `it.only` sem justificativa escrita.
- [ ] A suíte `unit` roda sem Docker.
- [ ] `npm run verify` está verde.
