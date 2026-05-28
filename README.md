# Vocab Spaced Repetition Learning

A fully-featured language learning and spaced repetition application built with Next.js, Prisma, PostgreSQL, and Clerk authentication. It uses the FSRS algorithm with chunked learning for new words.

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
chmod +x deploy/restart.sh
./deploy/restart.sh
```

Or manually:

```bash
docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
```

App is served at **`https://YOUR_PUBLIC_DOMAIN`**. The app container listens on port 3000 **inside Docker only**; Caddy terminates TLS on 443.

**Security:** Postgres is bound to `127.0.0.1:5432` only (not exposed to the internet). Do not publish port 5432 publicly.

After each deploy, hard-refresh the browser (Ctrl+Shift+R) to avoid stale Server Action errors.

## Local development (app on host)

1. Start database only: `docker compose up db -d`
2. `npm install`
3. `npx prisma migrate dev`
4. `npm run dev`

Postgres is available at `127.0.0.1:5432` with credentials from `.env`.

## Project layout

```
public/icon.png     App icon (favicon, header, landing)
src/app/            Next.js routes and UI
src/components/     Shared React components
src/lib/            Business logic (FSRS, study, vocab)
prisma/             Database schema and migrations
deploy/             Docker/Caddy production scripts
backup/             Local DB backup notes (data not in git)
```

`AGENTS.md` is kept for Cursor/AI editor hints about this Next.js version.

## Auth behavior

- Protected routes redirect to `/sign-in?returnTo=...` when logged out
- After sign-in, you return to the page you tried to visit
- Signed-in users visiting `/` go straight to `/dashboard`
