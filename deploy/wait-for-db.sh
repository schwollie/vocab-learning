#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  host="${DATABASE_URL#*@}"
  host="${host%%/*}"
  dbhost="${host%%:*}"
  dbport="${host#*:}"
  dbport="${dbport%%\?*}"
  dbport="${dbport:-5432}"
  user="${POSTGRES_USER:-postgres}"

  echo "Waiting for Postgres at ${dbhost}:${dbport}..."
  until pg_isready -h "$dbhost" -p "$dbport" -U "$user" >/dev/null 2>&1; do
    sleep 1
  done

  dbname="${POSTGRES_DB:-vocab_learning}"
  echo "Verifying database credentials..."
  until PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$dbhost" -p "$dbport" -U "$user" -d "$dbname" -c "SELECT 1" >/dev/null 2>&1; do
    sleep 1
  done
  echo "Postgres is ready (${dbname})."
fi

exec "$@"
