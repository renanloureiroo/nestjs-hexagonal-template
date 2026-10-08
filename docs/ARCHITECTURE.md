# Arquitetura do backend

Este documento define como um backend criado a partir deste template deve ser organizado e
como novas funcionalidades devem ser construídas. O projeto ainda está no início;
portanto, este texto é prescritivo. Quando código e documento divergirem, a
divergência deve ser resolvida no mesmo pull request.

O padrão adota um núcleo independente de framework, módulos por contexto de
negócio, portas e adaptadores explícitos e testes como contrato. Ele é a versão
Node.js do template Java/Spring: contratos HTTP, códigos de erro e tipos de teste
são os mesmos.

Veja também [TESTS.md](TESTS.md).

---

## 1. Stack de referência

- Node.js 24 LTS, ESM e TypeScript estrito;
- NestJS 12 sobre Express, com class-validator e `@nestjs/swagger`;
- PostgreSQL com Drizzle ORM e migrations SQL geradas pelo drizzle-kit;
- `@nestjs/event-emitter` para eventos de domínio em processo;
- OpenTelemetry com auto-instrumentação;
- Vitest, Supertest e Testcontainers;
- ESLint, Prettier e npm.

Versões exatas ficam no `package.json` e no `package-lock.json`. Dependência nova
precisa resolver um problema concreto; não se adiciona infraestrutura por
antecipação.

## 2. Regra principal

A dependência aponta em uma única direção:

```text
infra  ─────►  application  ─────►  domain
  │                                      ▲
  └────────────────►  core  ◄────────────┘
```

`infra` conhece Nest, HTTP, Drizzle e serviços externos. `application`, `domain`
e `core` são TypeScript puro e não conhecem detalhes de entrega ou persistência.

São proibidos em `src/core`, `src/modules/*/domain` e `src/modules/*/application`:

- `@nestjs/*`;
- `drizzle-orm`, `pg` e qualquer driver;
- `class-validator` e `class-transformer`;
- `express` e `@opentelemetry/*`;
- qualquer import de uma pasta `infra`.

A regra é verificada pelo ESLint (`no-restricted-imports` em `eslint.config.js`);
violá-la quebra `npm run verify`.

### Portas como classes abstratas

TypeScript apaga interfaces em runtime, e o Nest precisa de um token para injetar.
Portas são declaradas como `abstract class` sem implementação: servem de tipo e
de token ao mesmo tempo, sem que o núcleo importe nada do Nest. Adaptadores e
fakes as estendem.

```ts
export abstract class NoteRepository {
  abstract save(note: Note): Promise<Note>;
  abstract findById(id: NoteId): Promise<Note | null>;
}
```

## 3. Estrutura do código

```text
src
├── main.ts
├── instrumentation.ts
├── core
│   ├── entity
│   ├── error
│   ├── event
│   ├── identity
│   ├── pagination
│   ├── transaction
│   └── usecase
├── infra
│   ├── app.module.ts
│   ├── config
│   ├── database
│   ├── event
│   ├── health
│   ├── http
│   │   ├── config
│   │   ├── error
│   │   └── validation
│   └── transaction
└── modules
    └── <contexto>
        ├── domain
        │   ├── entities
        │   ├── events
        │   └── valueobjects
        ├── application
        │   ├── errors
        │   ├── gateways
        │   ├── repositories
        │   ├── services
        │   └── usecases
        └── infra
            ├── config
            ├── database/drizzle
            │   ├── schema
            │   ├── mappers
            │   └── repositories
            ├── events
            ├── gateways
            └── http
                ├── controllers
                ├── dtos
                └── presenters
```

Arquivos usam `kebab-case` com sufixo de papel: `note-title.ts`,
`create-note.use-case.ts`, `note-not-found.error.ts`, `notes.schema.ts`,
`note.controller.ts`. Imports são relativos e terminam em `.js`, como exige o ESM
do Node. Não há barrels (`index.ts`): cada import aponta para o arquivo que define
o símbolo.

Um módulo representa um contexto de negócio, não uma entidade ou tabela. Algo só
sobe para `core` quando pelo menos dois módulos realmente precisarem dele.

Módulos não importam o domínio uns dos outros. Quando um contexto precisa de uma
capacidade de outro, declara uma porta em `application/gateways`; o adaptador em
`infra/gateways` faz a travessia.

## 4. Modelo de domínio

### Entidades e identificadores

Uma entidade tem identidade e estende `Entity<ID extends Id>`. Cada identificador
é opaco, tipado e oferece duas factories:

```ts
export class ResourceId extends Id {
  private constructor(value: string) {
    super(value);
  }

  static generate(): ResourceId {
    return new ResourceId(Id.newValue());
  }

  static of(value: string): ResourceId {
    return new ResourceId(value);
  }
}
```

Entidades possuem duas entradas explícitas:

- `create(...)`, para um objeto que nasce agora;
- `restore(...)`, para reconstrução a partir da persistência.

Construtores são `private`. Mapper de persistência sempre chama `restore`, nunca
`create`.

Quando uma entidade delimita uma fronteira de consistência e produz eventos de
domínio, ela estende `AggregateRoot<ID>`. A base registra `DomainEvent` e expõe
`pullDomainEvents()`, que devolve e limpa os eventos pendentes. O módulo de
exemplo demonstra o ciclo completo com `NoteCreated`, `DomainEventPublisher` e um
`NoteCreatedListener` executado após o commit.

Todo `DomainEvent` carrega um `name` estável (por exemplo
`example.note_created`) usado para roteamento. O nome da classe não é usado
porque não é contrato.

### Value objects e invariantes

Value object é definido pelo conteúdo: classe com construtor `private`, factory
estática `of`, campos `readonly`, `equals` estrutural e `toString` quando
representa um valor externo. Toda invariante é validada no construtor privado. Um
tipo de domínio construído é sempre válido; casos de uso não repetem sua
validação.

Igualdade nunca usa `===` entre objetos de domínio: entidades, ids e value objects
expõem `equals`.

Ausência em leitura é `null` explícito no tipo de retorno (`Promise<Note | null>`);
`undefined` nunca sai de uma porta. Tempo é `Date`, armazenado como
`timestamp with time zone` e serializado em ISO 8601 UTC. O processo roda com
`TZ=UTC`.

Entidades que não produzem eventos continuam estendendo `Entity`; `AggregateRoot`
não é usado apenas como marcador.

## 5. Erros

Todo erro da aplicação estende `ApplicationError` e carrega:

- `type: ErrorType`, independente de HTTP;
- `code` estável no formato `<contexto>.<motivo>`.

O `code` é contrato público. A mensagem é texto humano e pode evoluir. Códigos
ficam em constantes `private static readonly` no tipo que os lança (ou em
constante de módulo, quando a classe é base de outras).

Famílias iniciais:

| `ErrorType`     | Semântica                      | HTTP |
| --------------- | ------------------------------ | ---: |
| `NOT_FOUND`     | recurso inexistente            |  404 |
| `CONFLICT`      | estado atual impede a operação |  409 |
| `VALIDATION`    | formato ou entrada inválida    |  400 |
| `UNAUTHORIZED`  | identidade ausente ou inválida |  401 |
| `FORBIDDEN`     | identidade sem permissão       |  403 |
| `BUSINESS_RULE` | regra de negócio violada       |  422 |

`ErrorType` é um objeto `as const` com tipo união, não um `enum`. A conversão
para status mora exclusivamente em `infra/http/error/error-type-http-status.ts`;
o mapa é um `Record<ErrorType, HttpStatus>`, então um tipo novo não compila até
ganhar seu status.

Erro recorrente ganha uma classe nomeada em `application/errors` e carrega o
dado útil à borda, não apenas uma mensagem (`NoteNotFoundError.noteId`).

Códigos reservados pela borda HTTP:

| `code`                | Quando                                                                         |
| --------------------- | ------------------------------------------------------------------------------ |
| `request.invalid`     | validação de DTO, JSON malformado ou outra requisição rejeitada pelo framework |
| `request.not_found`   | rota inexistente                                                               |
| `internal.unexpected` | qualquer erro não previsto                                                     |

## 6. Casos de uso

Cada caso de uso:

- é uma classe pura, sem `@Injectable()` ou outro decorator de framework;
- implementa uma interface de `core/usecase`;
- possui um único método `execute`, sempre assíncrono;
- declara `<Nome>Input` e `<Nome>Output` como interfaces `readonly` no mesmo arquivo;
- recebe tipos da aplicação, nunca DTO HTTP;
- devolve um output, nunca uma entidade de domínio.

Um output compartilhado em `application/outputs` só nasce quando casos de uso
realmente compartilham o mesmo contrato semântico. Formatos apenas coincidentes
permanecem como outputs independentes.

As quatro assinaturas compartilhadas são:

```ts
UseCase<I, O>; // execute(input: I): Promise<O>
UseCaseWithoutInput<O>; // execute(): Promise<O>
UseCaseWithoutOutput<I>; // execute(input: I): Promise<void>
UseCaseWithoutInputAndOutput; // execute(): Promise<void>
```

O cabeamento fica em `modules/<contexto>/infra/config/<contexto>.module.ts`, com
um provider `useFactory` explícito por caso de uso, no papel do `@Bean`:

```ts
{
  provide: CreateNoteUseCase,
  inject: [NoteRepository, DomainEventPublisher, Transactor],
  useFactory: (notes, events, transactor) =>
    withTransactions(new CreateNoteUseCase(notes, events), transactor),
}
```

## 7. Persistência e transações

A persistência de um agregado é formada por quatro peças:

1. porta em `application/repositories`, falando em tipos de domínio;
2. schema Drizzle separado, em `infra/database/drizzle/schema/<tabela>.schema.ts`;
3. mapper explícito domínio ↔ linha;
4. adaptador que estende a porta e usa `Database.executor`.

Entidade de domínio e linha do banco nunca são o mesmo tipo. SQL cru só entra
quando o query builder do Drizzle não expressar a consulta de forma clara.

Transação é decisão do caso de uso. Ela entra quando duas escritas precisam ser
atômicas ou quando leitura e escrita precisam observar o mesmo instante do banco.
Uma escrita isolada não justifica transação explícita.

O caso de uso declara a intenção com `@Transactional()` de `core/transaction`,
um decorator puro que apenas marca o método. Em `infra`, `withTransactions`
envolve o objeto num `Proxy` que executa os métodos marcados dentro de
`Transactor.inTransaction`. Quando a transação precisa ser programática, o caso de
uso recebe a porta `Transactor`.

A transação corrente é propagada por `AsyncLocalStorage` em `infra/database/database.ts`.
Adaptadores sempre usam `database.executor`, que é a transação ativa ou o pool; eles
nunca recebem transação por parâmetro e nunca abrem transação própria. Transação
aninhada participa da externa (propagação `REQUIRED`).

### Migrations

- ficam em `drizzle/`, geradas por `npm run db:generate -- --name <descricao>`;
- usam prefixo `yyyyMMddHHmmss` UTC (`migrations.prefix = 'timestamp'`);
- nunca são editadas depois de aplicadas;
- são aplicadas no boot da aplicação, antes de aceitar requisições;
- acompanham índice para todo campo usado em filtro, ordenação ou junção;
- o schema TypeScript e a migration mudam no mesmo commit; `npm run db:check`
  valida a consistência do histórico.

Unicidade de negócio deve existir também como constraint no banco.

## 8. Borda HTTP

Controllers apenas adaptam HTTP para a aplicação:

1. recebem e validam o DTO;
2. convertem o DTO para o `Input` do caso de uso;
3. executam o caso de uso;
4. passam o `Output` a um presenter;
5. montam status e headers.

Regras da borda:

- o prefixo global `/api` vem de `configureApp`; controllers não o repetem;
- criação retorna `201` e header `Location`;
- DTO de entrada é classe com constraints de class-validator e `toInput()`;
- ausência e tamanho usam `NotBlank` e `MaxChars` de `infra/http/validation`,
  com a semântica de `@NotBlank` e `@Size` do Bean Validation;
- mensagens das constraints espelham as invariantes correspondentes;
- presenter é um objeto `as const` com método `present`, sem estado;
- OpenAPI mora em `<recurso>.controller.swagger.ts`, como decorators compostos
  com `applyDecorators`, aplicados ao controller;
- todo status possível é documentado com `ProblemDetailDTO`;
- `try/catch` para traduzir erro no controller é proibido.

Toda falha HTTP é produzida pelo `ApiExceptionFilter` em RFC 9457
(`application/problem+json`), com `title`, `status`, `detail`, `instance`, `code`
e, quando disponível, `traceId`. `type` é omitido: a RFC assume `about:blank` quando ele falta. Falhas de validação acrescentam
`errors` com uma mensagem por campo. Erros inesperados viram
`internal.unexpected` sem expor detalhes internos.

`configureApp` em `infra/http/configure-app.ts` é a única configuração da borda e
é usada tanto pelo `main.ts` quanto pelo E2E.

## 9. Fluxo ponta a ponta

```text
requisição
   │
   ▼
DTO + class-validator
   │
   ▼
controller ─► input do caso de uso
   │
   ▼
caso de uso ─► domínio ─► porta de repositório
   │                              │
   │                              ▼
   │                  adaptador Drizzle ─► PostgreSQL
   ▼
output ─► presenter ─► resposta HTTP
```

Exceções sobem intactas até o `ApiExceptionFilter`. Nenhuma camada intermediária
as converte para conceitos HTTP.

### Eventos de domínio

O caso de uso publica `aggregate.pullDomainEvents()` pela porta
`DomainEventPublisher`. O adaptador entrega os eventos ao `EventEmitter2` somente
depois do commit; um rollback os descarta. Listeners ficam em
`modules/<contexto>/infra/events` e usam `@OnEvent(<Evento>.NAME)`. Falha de um
listener é registrada e não desfaz a resposta, porque o commit já aconteceu.

## 10. Performance e observabilidade

- listagens públicas são paginadas com `PageQuery` e `Page` de `core/pagination`;
- é proibida chamada a repositório ou I/O remoto dentro de laço;
- consultas de coleção não podem produzir N+1;
- cache só entra para resolver problema medido;
- logs usam `Logger` do Nest e vivem em `infra`;
- erro é logado uma vez, na borda;
- estado de requisição não usa variável de módulo; contexto por requisição usa
  `AsyncLocalStorage`;
- código síncrono pesado não roda no event loop de requisição.

OpenTelemetry é carregado por `node --import ./dist/instrumentation.js` antes da
aplicação. Exportadores e endpoint são configurados pelas variáveis `OTEL_*`
padrão; `OTEL_SDK_DISABLED=true` desliga a telemetria.

Ainda não há SLO numérico. Ele será definido quando existir baseline real de
tráfego e latência.

## 11. Ordem de implementação

Para cada funcionalidade:

1. value objects e entidade, precedidos por testes de invariantes;
2. porta de repositório e fake em `test/testsupport`;
3. caso de uso, precedido por testes sobre o fake;
4. schema Drizzle, migration, mapper e adaptador;
5. DTO de entrada, precedido por testes de constraints;
6. presenter, contrato OpenAPI e controller;
7. teste E2E;
8. provider no módulo do contexto.

Correção de bug começa por um teste que reproduz o defeito.

## 12. Convenções gerais

- identificadores, nomes de campos JSON e códigos de erro em inglês;
- mensagens de erro, descrições OpenAPI e nomes de teste em português;
- Prettier aplicado pelo editor (`npm run format`), sem portão no `verify`;
- `any` é proibido; `unknown` com estreitamento explícito quando o tipo é aberto;
- comentários explicam decisões e alternativas descartadas, não a assinatura;
- abstração nova somente quando o segundo caso concreto a exigir.

## 13. Checklist de arquitetura

- [ ] Nenhum framework em `core`, `domain` ou `application`.
- [ ] Invariantes pertencem ao domínio.
- [ ] Caso de uso é classe pura e recebe `Input`, não DTO.
- [ ] Portas ficam em `application`; adaptadores, em `infra`.
- [ ] Entidades de domínio e schema de persistência são separados.
- [ ] Erros possuem `type` e `code` estável.
- [ ] Controller não contém regra nem tradução local de erro.
- [ ] OpenAPI anuncia todos os status possíveis.
- [ ] Toda alteração de schema possui migration nova.
- [ ] Listagens são paginadas e consultas não produzem N+1.
- [ ] `npm run verify` está verde.

## 14. Decisões ainda abertas

Não devem ser inventadas antes do primeiro caso concreto:

- contextos de negócio e agregados;
- autenticação e autorização;
- integrações externas;
- estratégia durável para eventos externos, como outbox;
- trava de migration para várias réplicas subindo ao mesmo tempo;
- cache;
- SLOs numéricos;
- estratégia de deployment.

Quando uma decisão dessas for tomada, ela deve atualizar este documento e, se
tiver alternativas relevantes ou custo duradouro, ganhar um ADR em
[`docs/adr`](adr/README.md).
