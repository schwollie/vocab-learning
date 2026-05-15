# Vocabulary Learning App - User Implementation Checklist

Welcome! I've started the implementation for our Vercel-like self-hosted Spaced Repetition application. We have already initialized the **Next.js application**. Here is your interactive checklist of things we need to complete or things you need to provide along the way.

## Phase 1: Setup & DevOps (In Progress)
- [x] Initialize Next.js app with TailwindCSS and TypeScript
- [x] Create `docker-compose.yml` for PostgreSQL and the Next.js app
- [ ] **USER ACTION REQUIRED**: Generate an SSH Key pair locally (`ssh-keygen -t rsa -b 4096`). Add the Public Key to your server's `~/.ssh/authorized_keys` and provide the Private Key as a GitHub Repository Secret named `SERVER_SSH_KEY` for GitHub Actions.
- [ ] **USER ACTION REQUIRED**: Setup additional GitHub Secrets: `SERVER_HOST` (your VPS IP: 159.195.38.197), `SERVER_USERNAME` (e.g. root or your user).
- [x] Setup GitHub Actions deploy script (`.github/workflows/deploy.yml`)

## Phase 2: Database & Authentication
- [x] Install Prisma and Auth.js
- [ ] **USER ACTION REQUIRED**: Get a Google OAuth Client ID and Secret (from Google Cloud Console -> APIs & Services -> Credentials -> Create OAuth client ID -> "Web application"). Set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google` (and your production URL later).
- [ ] **USER ACTION REQUIRED**: Copy `.env.example` to `.env` and fill in the values (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and create a random string for `NEXTAUTH_SECRET` using `openssl rand -base64 32`).
- [x] Define the Prisma Schema (`Folder`, `VocabSet`, `VocabItem`, `ReviewLog`, `UserSettings`)
- [ ] **USER ACTION REQUIRED**: Run initial Database migrations (*You can do this by running `npx prisma db push` or `npx prisma migrate dev` locally once your postgres container or local postgres is running*).

## Phase 3: Vocabulary Management & Smart Import
- [ ] Build the Dashboard UI
- [ ] Create the Vocabulary Set Editor (CRUD)
- [ ] Implement the "Smart Text Importer" with Regex parsing

## Phase 4: Learning Engine & Audio (Web Speech API)
- [ ] Build the Flashcard Learning UI
- [ ] Implement Spaced Repetition (FSRS algorithm integration)
- [ ] Integrate Web Speech API (Local TTS)
- [ ] Implement User Settings (Autoplay, Front/Back swap, Voice selection)

## Phase 5: Sharing & Finalization
- [ ] Implement Set Sharing via Links
- [ ] Implement Random/Cram modes
