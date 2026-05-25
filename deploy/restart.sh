#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Building and restarting production stack (HTTPS)..."
docker compose -f docker-compose.yml -f docker-compose.https.yml build app
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --force-recreate --remove-orphans

echo "Done. Use https://${PUBLIC_DOMAIN:-your-domain} (hard-refresh browser after deploy)."
