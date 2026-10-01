#!/usr/bin/env bash
# Renomeia o template para um projeto novo. Executado automaticamente pelo workflow
# template-init no primeiro push de um repositório criado com "Use this template", ou
# manualmente depois de clonar:
#
#   scripts/init-template.sh <nome-do-projeto>
#   scripts/init-template.sh orders-service
set -euo pipefail

usage() {
  echo "uso: scripts/init-template.sh <nome-do-projeto>" >&2
  exit 1
}

[[ $# -ge 1 && -n "$1" ]] || usage
cd "$(dirname "$0")/.."

[[ -f .template-init ]] || {
  echo "Este projeto já foi inicializado (.template-init ausente)." >&2
  exit 1
}

# orders-service → orders_service, Orders Service
kebab=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')
[[ -n "$kebab" ]] || usage
snake=${kebab//-/_}
title=$(printf '%s' "$kebab" | awk -F- '{ for (i = 1; i <= NF; i++) printf "%s%s%s", (i > 1 ? " " : ""), toupper(substr($i, 1, 1)), substr($i, 2) }')

echo "Projeto:        $kebab"
echo "Banco local:    $snake"
echo "Título da API:  $title API"

# Arquivos versionados, exceto tooling e o próprio mecanismo de inicialização.
files=()
while IFS= read -r file; do
  files+=("$file")
done < <(git ls-files | grep -vE '^(\.github/workflows/|\.specify/|\.claude/|\.agents/|scripts/init-template\.sh$|\.template-init$)')

# Ordem importa: nomes mais longos antes dos mais curtos que eles contêm.
for file in "${files[@]}"; do
  [[ -f "$file" ]] || continue
  perl -pi -e "
    s/^# NestJS Hexagonal Template\$/# $title/;
    s/nestjs-hexagonal-template/$kebab/g;
    s/hexagonal_template/$snake/g;
    s/Hexagonal Template API/$title API/g;
  " "$file"
done

# Trechos que só fazem sentido no template deixam de existir no projeto gerado.
perl -0pi -e 's/<!-- template:start -->.*?<!-- template:end -->\n\n?//gs' README.md

git rm -q .template-init scripts/init-template.sh
echo "Pronto. Revise com 'git status' e rode npm install && npm run verify."
