# syntax=docker/dockerfile:1
# Imagem base dos três estágios, fixada por versão e digest: a tag `node:24-slim` muda sozinha a
# cada release do Node, e a imagem passaria a mudar sem nenhum commit. Subir a versão é uma
# mudança explícita aqui (e no .nvmrc, que o CI usa nos testes).
ARG NODE_IMAGE=node:24.22.3-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54

# Desenvolvimento: dependências completas e o Nest em modo watch, com o debugger na 9229.
# `docker build --target dev` e um volume com o src/ dão hot reload dentro do container.
FROM ${NODE_IMAGE} AS dev
# O watch do Nest encerra o processo antigo pela árvore de processos (tree-kill), que usa o
# `ps`. A imagem slim não tem: sem ele, o processo antigo fica preso na porta 8080.
RUN apt-get update && apt-get install -y --no-install-recommends procps \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV TZ=UTC PORT=8080
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY drizzle ./drizzle
# O Nest roda a aplicação por este script e sem shell (--no-shell): o `exec` faz o processo
# ser o próprio node, então no reload o Nest só sobe o novo quando o antigo já soltou as
# portas 8080 e 9229.
COPY --chmod=755 <<'SCRIPT' /usr/local/bin/node-dev
#!/bin/sh
exec node --inspect=0.0.0.0:9229 --import ./dist/instrumentation.js "$@"
SCRIPT
EXPOSE 8080 9229
CMD ["npx", "nest", "start", "--watch", "--preserveWatchOutput", "--no-shell", "--exec", "/usr/local/bin/node-dev"]

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production TZ=UTC PORT=8080
# Versão da imagem (por exemplo, a tag sha-<commit>), passada pelo CI no build e informada pelo
# /api/health: o deploy sabe que a versão nova está no ar quando o health devolve o sha novo.
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle
USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health/live').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
ENTRYPOINT ["node", "--import", "./dist/instrumentation.js", "dist/main.js"]
