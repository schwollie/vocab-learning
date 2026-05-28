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

COMPOSE_FILES=(-f docker/docker-compose.yml)
ROOT="$(pwd)"
ENV_FILE="${ROOT}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env in ${ROOT}. Copy .env.example and set POSTGRES_PASSWORD, etc." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if ! docker network inspect proxy >/dev/null 2>&1; then
  echo "Docker network 'proxy' not found. Start ~/reverse-proxy first:" >&2
  echo "  cd ~/reverse-proxy && ./deploy/restart.sh" >&2
  exit 1
fi

echo "Using env file: ${ENV_FILE}"
echo "Building and restarting vocab stack (app + db)..."
docker compose --env-file "$ENV_FILE" --project-directory "$ROOT" "${COMPOSE_FILES[@]}" build app
docker compose --env-file "$ENV_FILE" --project-directory "$ROOT" "${COMPOSE_FILES[@]}" up -d --force-recreate --remove-orphans

VOCAB_HOST="vocab.${PUBLIC_DOMAIN:-your-domain}"
echo "Done. App URL: https://${VOCAB_HOST} (hard-refresh browser after deploy)."
echo "Ensure reverse-proxy is running: cd ~/reverse-proxy && ./deploy/restart.sh"
