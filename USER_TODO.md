# Vocabulary Learning App - Implementation Checklist

## Completed
- [x] Initialize Next.js app with TailwindCSS and TypeScript
- [x] Create `docker-compose.yml` for PostgreSQL and the Next.js app
- [x] Define the Prisma Schema (`Folder`, `VocabSet`, `VocabItem`, `ReviewLog`, `UserSettings`)
- [x] Connect `schema.prisma` and `.env` to the Docker Network PostgreSQL instance.
- [x] Replace NextAuth with **Clerk Authentication**.
- [x] Implement Dashboard (View Sets, Create Sets).
- [x] Implement the "Smart Text Importer" with Regex parsing and Deck Editing UI.

## Phase 4: Learning Engine & Audio (Web Speech API)
- [x] Scaffold Flashcard Study Interface setup
- [x] Implement FSRS algorithm integration to track progress and schedule reviews
- [x] Build the Flashcard Learning UI components (Animations, Rating buttons)
- [x] Integrate Web Speech API (Local TTS) Audio

## Phase 5: Sharing & Finalization
- [ ] Implement Set Sharing via Links
- [ ] Implement Random/Cram modes
- [ ] Implement User Settings (Autoplay, Front/Back swap, Voice selection)

## DevOps
- [ ] Generate SSH keys and configure GitHub Actions for auto-deploy to the server (`.github/workflows/deploy.yml`) - *If desired later, or omit since you pull manually.*
