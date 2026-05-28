#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${CHECK:-}" == "1" ]]; then
  echo "Running pre-deploy checks (CHECK=1)..."
  ./scripts/check.sh
fi

echo "Node on host: $(command -v node >/dev/null && node -v || echo 'not installed')"
echo "npm on host: $(command -v npm >/dev/null && npm -v || echo 'not installed')"
echo "Docker: $(docker -v)"

COMPOSE_FILES=(-f docker/docker-compose.yml -f docker/docker-compose.https.yml)
# Compose files live under docker/, so the default project dir would be docker/ and
# root .env would not load. Explicit --env-file and --project-directory keep .env at repo root.
ROOT="$(pwd)"
ENV_FILE="${ROOT}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env in ${ROOT}. Copy .env.example and set POSTGRES_PASSWORD, etc." >&2
  exit 1
fi

echo "Using env file: ${ENV_FILE}"
echo "Building and restarting production stack (HTTPS)..."
docker compose --env-file "$ENV_FILE" --project-directory "$ROOT" "${COMPOSE_FILES[@]}" build app
docker compose --env-file "$ENV_FILE" --project-directory "$ROOT" "${COMPOSE_FILES[@]}" up -d --force-recreate --remove-orphans

echo "Done. Use https://${PUBLIC_DOMAIN:-your-domain} (hard-refresh browser after deploy)."
