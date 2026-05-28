# Vocab Spaced Repetition Learning

A fully-featured language learning and spaced repetition application built with Next.js, Prisma, PostgreSQL, and Clerk authentication. It uses the FSRS algorithm with chunked learning for new words.

## Toolchain

- **Node.js 24 LTS** for local dev and CI-style checks (see `.nvmrc`)
- **Production app** runs in Docker (`node:24-alpine`); the VPS does not need Node installed unless you develop on the server
- **PostgreSQL 17** in Docker Compose

### `npm: command not found` on the server?

Deploy uses Docker only, so `npm` inside the container is normal. For local commands on the VPS without installing Node:

```bash
chmod +x scripts/docker-npm.sh scripts/check.sh
./scripts/docker-npm.sh test
./scripts/docker-npm.sh ci
```

To install Node 24 on the host (Debian/Ubuntu example):

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
cd ~/vocab-learning && npm ci
```

## Production deployment checklist

1. Copy [`.env.example`](.env.example) to `.env` and set:
   - Strong `POSTGRES_PASSWORD` (same value in `DATABASE_URL`)
   - Clerk **production** keys (`pk_live_` / `sk_live_`)
   - Clerk sign-in URLs (`NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, etc.)
   - `PUBLIC_DOMAIN` (e.g. `159-195-38-197.sslip.io` for sslip.io)
2. In the **Clerk Dashboard**, allow your HTTPS origin, e.g. `https://159-195-38-197.sslip.io`
3. Open firewall ports **80** and **443** on the server
4. One-time DB password sync after changing `POSTGRES_PASSWORD` (keeps all data):

```bash
docker exec vocab-db psql -U postgres -d vocab_learning \
  -c "ALTER USER postgres WITH PASSWORD 'your_new_password';"
```

5. Deploy with HTTPS (recommended):

```bash
chmod +x deploy/restart.sh scripts/check.sh scripts/docker-npm.sh
./deploy/restart.sh
```

Optional pre-deploy checks (host `npm` or Docker fallback):

```bash
CHECK=1 ./deploy/restart.sh
```

Or manually:

```bash
docker compose --env-file .env --project-directory . \
  -f docker/docker-compose.yml -f docker/docker-compose.https.yml up -d --build
```

(`./deploy/restart.sh` passes `--env-file .env` automatically; required because compose files are under `docker/`.)

App is served at **`https://YOUR_PUBLIC_DOMAIN`**. The app container listens on port 3000 **inside Docker only**; Caddy terminates TLS on 443.

**Security:** Postgres is bound to `127.0.0.1:5432` only (not exposed to the internet). Do not publish port 5432 publicly.

After each deploy, hard-refresh the browser (Ctrl+Shift+R) to avoid stale Server Action errors.

## Local development (app on host)

1. Use Node 24 (`nvm install` / `nvm use` with `.nvmrc`)
2. Start database only: `docker compose -f docker/docker-compose.yml up db -d`
3. `npm ci`
4. `npx prisma migrate dev`
5. `npm run dev`

Postgres is available at `127.0.0.1:5432` with credentials from `.env`.

### Quality checks

```bash
npm run test        # Vitest (config in config/vitest.config.ts)
npm run lint
npm run typecheck
npm run ci          # lint + test + typecheck + build
```

### `npm install` messages (fund / audit)

| Message | Meaning | Action |
|---------|---------|--------|
| **166 packages are looking for funding** | Maintainers accept sponsorship — not a problem | Safe to ignore, or run `npm install --no-fund` to hide |
| **4 vulnerabilities** (before fixes) | `npm audit` scanning the dependency tree | Run `npm audit fix` (never `--force` unless you mean to downgrade Next) |

This repo uses:

- `npm audit fix` — fixed **js-cookie** (via Clerk) high-severity issues
- `"overrides": { "postcss": "8.5.14" }` in [package.json](package.json) — Next 16.2.6 still bundles old PostCSS internally; the override pins a patched version (build-time only; [Next.js discussion](https://github.com/vercel/next.js/issues/93234))

After `npm ci`, you should see **`found 0 vulnerabilities`**. Do **not** run `npm audit fix --force` — npm may try to install ancient `next@9` and break the app.

## Project layout

```
config/             Vitest config (keeps repo root minimal)
deploy/             Caddy + restart script
docker/             Dockerfile and compose files
docs/               ARCHITECTURE.md, AGENTS.md
prisma/             Schema and migrations
public/             Static assets
scripts/            docker-npm.sh, check.sh (host without Node)
src/                Application code
tests/              Unit tests (mirrors src/lib)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for module structure.

`docs/AGENTS.md` — Cursor/AI editor hints for this Next.js version.

## Auth behavior

- Protected routes redirect to `/sign-in?returnTo=...` when logged out
- After sign-in, you return to the page you tried to visit
- Signed-in users visiting `/` go straight to `/dashboard`
