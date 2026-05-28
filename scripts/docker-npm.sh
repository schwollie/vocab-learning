#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <script-name|npm-args...>" >&2
  echo "Examples: $0 ci | $0 test | $0 run lint" >&2
  exit 1
fi

ENV_FILE_ARGS=()
if [[ -f .env ]]; then
  ENV_FILE_ARGS=(--env-file .env)
fi

if [[ $# -eq 1 ]]; then
  NPM_INNER="npm run $(printf '%q' "$1")"
else
  NPM_INNER="npm"
  for arg in "$@"; do
    NPM_INNER+=" $(printf '%q' "$arg")"
  done
fi

docker run --rm "${ENV_FILE_ARGS[@]}" \
  -e DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/vocab_learning?schema=public}" \
  -v "$(pwd):/app" -w /app \
  node:24-alpine \
  sh -c "apk add --no-cache openssl libc6-compat >/dev/null && ${NPM_INNER}"
