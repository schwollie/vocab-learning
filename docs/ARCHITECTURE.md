# Architecture

## Layers

| Layer | Path | Role |
|-------|------|------|
| Routes & UI | `src/app/`, `src/components/` | Next.js App Router pages and React components |
| Domain logic | `src/lib/{domain}/` | Pure helpers, types, and co-located `"use server"` actions |
| Data | `prisma/` | Schema and migrations |
| Tests | `tests/lib/` | Vitest unit tests (mirror `src/lib` domains) |

## Domain modules (`src/lib/`)

- **`auth/`** — Clerk user sync (`ensureUser`), safe redirects
- **`db/`** — Prisma client singleton
- **`languages/`** — BCP-47 catalog (UI labels + ISO-639-3 for lexicon APIs)
- **`folders/`** — Folder tree queries
- **`vocab/`** — Item types, paste parser, CRUD server actions
- **`study/`** — Session types, chunking, autoplay, review schedule charts
- **`study/session/`** — Session persistence and queue building (used by `app/study/session-actions.ts`)
- **`fsrs/`** — Scheduling, rating previews, interval formatting
- **`lexicon/`** — Tatoeba/Wiktionary providers and `fetchLexicon` action

## Import rules

1. **Components** import from `@/lib/{domain}` (public `index.ts` barrels) or `@/app/.../actions` for study session RPC only.
2. **`lib/` must not** import from `app/` or `components/`.
3. **Cross-domain** imports use the target domain’s public barrel (e.g. `@/lib/folders`, `@/lib/languages`).
4. **Inside a domain**, use relative imports to avoid circular dependencies through barrels.
5. **Tests** live under `tests/` and import via the `@/` alias.

## Server actions

- **Study sessions** — thin `src/app/study/session-actions.ts` delegates to `lib/study/session/*`.
- **Vocab CRUD** — `lib/vocab/actions.ts`.
- **Lexicon** — `lib/lexicon/actions.ts`.

## Root layout

Keep the repo root to tool entrypoints only (`package.json`, `tsconfig.json`, `next.config.ts`, eslint/postcss, `.nvmrc`).

```
config/     Vitest config
docker/     Dockerfile and compose files
docs/       AGENTS.md, ARCHITECTURE.md
deploy/     Caddy + restart.sh
scripts/    check.sh, docker-npm.sh (npm on host without Node)
tests/      Vitest tests
src/        Application source
prisma/     Database schema
```

## Checks without host Node

```bash
./scripts/docker-npm.sh ci
CHECK=1 ./deploy/restart.sh
```
