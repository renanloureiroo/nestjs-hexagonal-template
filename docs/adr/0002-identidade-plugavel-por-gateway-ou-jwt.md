# 0002. Identidade plugável: header do gateway ou JWT por JWKS

- **Status:** Aceito
- **Data:** 2026-11-20
- **Decisores:** Renan Loureiro
- **Relacionados:** `src/infra/http/identity`

## Contexto

A autenticação era uma das decisões abertas do template. Os serviços derivados dele chegaram a duas
formas de saber quem chama a API:

- **Atrás de um gateway** (Kong, Traefik, API Gateway): o gateway valida o token e grava o sujeito
  num header que ele sempre sobrescreve. O serviço confia no header e não toca no token.
- **Sem gateway**: uma API só, exposta direto, que valida o JWT do provedor de identidade (Clerk,
  Auth0, Cognito, Keycloak) pelas chaves públicas publicadas em JWKS.

Escolher uma das duas no template obrigaria metade dos projetos a reescrever a borda.

## Decisão

A borda HTTP ganha a porta `IdentityResolver`, que recebe a requisição e devolve a
`RequestIdentity` (`subject` e `claims`) ou `null`. Há dois adaptadores, escolhidos no boot por
`IDENTITY_MODE`:

- `gateway` (padrão): `GatewayHeadersIdentityResolver` lê o header configurado em
  `IDENTITY_SUBJECT_HEADER` (padrão `x-auth-subject`).
- `jwt`: `JwtIdentityResolver` valida o `Authorization: Bearer` com `jose`, sem SDK do provedor:
  assinatura (RS256, ES256 ou EdDSA), emissor, validade com tolerância de relógio, audiência quando
  `JWT_AUDIENCE` existe e `azp` quando `JWT_AUTHORIZED_PARTIES` lista origens.

`@RequiresIdentity()` aplica o `IdentityGuard` por controller ou rota, e `@AuthenticatedIdentity()`
entrega a identidade ao controller. Sem identidade, a resposta é `401` com `code`
`auth.unauthenticated`, antes do pipe de validação. Caso de uso nunca lê header nem claim: recebe o
`subject` no `Input`.

## Alternativas consideradas

### Porta com dois adaptadores (escolhida)

- **Prós:** o projeto troca de topologia mudando uma variável; controllers e casos de uso não
  mudam; os dois adaptadores têm teste.
- **Contras:** dois caminhos para manter no template.

### SDK do provedor (por exemplo, `@clerk/backend`)

- **Prós:** menos código próprio.
- **Contras:** amarra o template a um fornecedor; validar JWT por JWKS é padrão e cabe em uma
  classe.

### Guard global

- **Prós:** nenhuma rota esquecida sem proteção.
- **Contras:** health, documentação e rotas públicas precisariam de exceção. Fica para quando a
  maioria das rotas exigir identidade.

## Consequências

- No modo `gateway`, a API nunca pode ficar exposta sem o gateway na frente: o header é confiável só
  porque o gateway o sobrescreve.
- No modo `jwt`, o JWKS é buscado e guardado em cache pelo `jose`; uma chave nova do provedor é
  buscada sozinha quando chega um `kid` desconhecido.
- Vincular o `subject` a um usuário do domínio (tabela de usuários, webhooks do provedor) é decisão
  de cada projeto.
