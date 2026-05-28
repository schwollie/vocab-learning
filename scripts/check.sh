#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if command -v npm >/dev/null 2>&1; then
  echo "Running checks with host npm ($(node -v))..."
  npm run ci
else
  echo "npm not found on host; running checks in Docker (node:24-alpine)..."
  ./scripts/docker-npm.sh ci
fi
