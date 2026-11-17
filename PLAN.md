# Game Tracker: Project Plan

Last updated: 2026-11-16

A single-user web app for tracking games owned across multiple platforms, with a one-time Steam library import and metadata pulled from IGDB. It is a learning project (first Java/Spring Boot app) and a portfolio piece.

## Goals

- Track games, the platforms they are owned on, playtime, backlog status, and a personal rating.
- Import a Steam library with a manual review step instead of blind syncing.
- Auto-fill developer, genre tags, series, and cover art from a metadata source.
- Learn Java, Spring Boot, JPA, Flyway, and Docker along the way.
- End with a repo that is easy to demo: README, screenshots, and optionally a hosted demo on sample data.

## Out of scope (for now)

- Multiple users, accounts, or authentication.
- Scheduled or background syncing of any kind.
- An "original system" field for emulated games.
- A Rust/Tauri desktop version (reserved for a separate project).

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | Java, latest LTS JDK | Confirm the current version when generating the project at start.spring.io |
| Backend | Spring Boot (Web, Data JPA, Validation) | REST API only, no server-rendered pages |
| Database | PostgreSQL in Docker Compose | See "Database and Docker" below |
| Migrations | Flyway | Schema changes are versioned SQL files |
| Build | Maven | |
| Frontend | React with Vite, TypeScript, Tailwind | Familiar ground, so learning time goes to Java |
| Tests | JUnit 5 and Spring Boot test support; Vitest and React Testing Library | Backend focus on import and matching logic |

Repo layout: a monorepo with `backend/` and `frontend/` folders, a root `docker-compose.yml`, and a root README.

## Data model

- **game**: name, series, personal rating (whole number from 1 to 10, optional), cover image URL, IGDB ID, Steam app ID, metadata last fetched timestamp
- **developer** and **game_developer**: many-to-many, since some games are co-developed
- **tag** and **game_tag**: genre tags, many-to-many
- **platform**: seeded list, including "Emulator" as a regular platform
- **entry**: one row per game per platform, holding playtime in minutes, backlog status, and playtime source (manual or Steam)
- **import_candidate**: staging rows from a Steam import, with the proposed IGDB match and a review state (pending, confirmed, skipped)

### Decisions

- **Playtime is per entry**, so the same game on two platforms is tracked separately.
- **An entry means the game is owned on that platform.** There is no separate ownership field.
- **Personal rating is stored once on the game** and displayed on every entry. Editing it from any entry changes it everywhere, with no copies to keep in step.
- **Backlog status is per entry.**

### Backlog status values

| Enum value | Display label | Meaning |
|---|---|---|
| `NOT_STARTED` | Not Started | Owned but not played |
| `PLAYING` | Playing | In progress |
| `FINISHED` | Finished | Main game beaten |
| `COMPLETED` | 100% | All achievements completed |
| `DROPPED` | Dropped | Abandoned |

## External data

### Steam (library and playtime)

- Uses the Steam Web API `GetOwnedGames` call with an API key and the 64-bit SteamID.
- The whole library, including playtime in minutes, comes back in one request.
- The Steam profile's game details must be set to public for the call to return data.

### IGDB (metadata and cover art)

- Covers all platforms, not only Steam: developers, genres, series, and covers.
- Requires a Twitch account with two-factor authentication and a Twitch developer app (client ID and secret).
- Rate limit is 4 requests per second per credential.
- To verify at signup: that it is free for non-commercial use, and that it exposes Steam app IDs for automatic matching.

### Fetching rules

- **On demand only.** Nothing runs on a schedule.
- Metadata is pulled once, when a Steam import candidate is confirmed or a game is added manually.
- A "Refresh metadata" button exists per game, plus a "Refresh all" action.
- Refresh only touches fetched fields (developer, tags, series, cover). It never overwrites rating, status, or manually entered playtime.
- The Steam import and the playtime update are button-triggered. A playtime update only changes entries whose playtime source is Steam.

### Rate limiting

- All IGDB calls go through one throttled client set to about 2 requests per second, half the allowed rate.
- "Refresh all" runs as a sequential queue with a progress indicator, batching several games per request where IGDB allows it.
- A 429 response triggers a pause and retry with backoff rather than a failure.
- The Twitch access token is cached and reused until it expires.
- Covers are stored as a URL at fetch time, so browsing the library makes no API calls.

### Secrets

- The Steam key and Twitch credentials live in backend configuration only, never in frontend code or in git.
- A public demo would run on seeded sample data, not real keys.

## Database and Docker

Only PostgreSQL runs in Docker Compose. Spring Boot and the Vite dev server run directly on Windows to keep the edit and restart loop fast.

- **Pinned version:** a specific Postgres major version in the compose file.
- **Named volume:** data survives container restarts and removals.
- **Host port 5433:** avoids a clash with any local Postgres on 5432.
- **Credentials in `.env`:** gitignored, with a committed `.env.example`.
- **Spring's Compose support:** Spring Boot may be able to start the compose file and wire the connection automatically in development. Verify against current docs during scaffolding.
- **Backups:** this holds real personal data, so plan an occasional `pg_dump` or a small export feature.
- **Caution:** removing the volume wipes the library.

## API surface

- **Games:** list, detail, create, update, delete. Filtering by platform, status, and search text is done in the browser; server-side filters are deferred until the library is too large for that.
- **Entries:** add, update, and remove a platform entry for a game
- **Metadata:** search IGDB by title, apply a result to a game, refresh one game, refresh all
- **Steam:** trigger an import, list pending candidates, confirm or skip each one, update playtime
- **Reference data:** platforms and tags

## Milestones

1. **Scaffold.** Spring Boot project, Docker Compose Postgres, first Flyway migration, health check endpoint. Learning: project structure, dependency injection, configuration, Docker basics.
2. **Core CRUD.** Games, platforms, and entries with validation and error handling. Learning: JPA entities, repositories, DTOs, controller and service layering.
3. **Frontend library view.** Table or grid with filtering, sorting, and add/edit forms. Learning: calling a separate API, CORS, the dev proxy.
4. **IGDB integration.** Token handling, title search, auto-fill, refresh buttons, throttled client. Learning: HTTP clients, secrets in config, rate limiting.
5. **Steam import.** Import into the staging table, auto-match, review queue UI, playtime update. Learning: transactions and idempotent imports.
6. **Presentation.** README with screenshots and an architecture summary, seed data, optional hosted demo on sample data.

## To do before milestone 4

- [ ] Register a Steam Web API key
- [ ] Find the 64-bit SteamID and set Steam game details to public
- [ ] Enable two-factor authentication on a Twitch account and create a Twitch developer app for IGDB credentials
- [ ] Confirm IGDB's non-commercial terms and Steam app ID matching

## Before milestone 1

- [x] Install Docker Desktop (needs WSL 2 on Windows)
- [x] Install the latest LTS JDK

## Pinned versions (set during milestone 1)

- JDK 25 (Temurin), Spring Boot 4.1.2, Maven via the wrapper (`backend/mvnw.cmd`)
- PostgreSQL 17, in both `docker-compose.yml` and the Testcontainers test configuration
- Spring's Docker Compose support is in use: running the app from `backend/` starts the container and configures the datasource
- Tests run against a throwaway Postgres container through Testcontainers

## Milestone 2 notes

- The `V2` migration creates only `game` and `entry`. The developer and tag tables come with milestone 4, and `import_candidate` with milestone 5, once the real data shapes are known.
- `game` already has the `cover_image_url`, `igdb_id`, `steam_app_id`, and `metadata_fetched_at` columns. They stay empty until milestones 4 and 5.
- `GET /api/games` returns every game with its entries, with no filters or paging. Filters arrive in milestone 3 when the UI needs them.
- Platforms are read-only through the API. A new platform is added with a migration.
- Errors are returned as `application/problem+json` (Spring's `ProblemDetail`). Validation errors add an `errors` object mapping field names to messages.

## Milestone 3 notes

- Versions: React 19, Vite 8, TypeScript 7, Tailwind 4, Vitest 5. Linting uses oxlint, which the Vite template now ships in place of ESLint.
- The library table has one row per entry. A game on two platforms appears twice, and a game with no entries appears once with an empty platform.
- The page loads everything from `GET /api/games` once, then filters and sorts in the browser. It reloads after every change.
- Data access is plain `fetch` in `frontend/src/api/client.ts`, with no data-fetching library.
- In development the Vite dev server proxies `/api` to the backend on port 8080, so the backend has no CORS configuration. A hosted demo (milestone 6) will need either CORS or the frontend served from the same origin.
- Adding a game with a first platform is two requests. If the second fails, the game is kept and the page shows a notice.
- Dialogs use the native `<dialog>` element. There is no router, form library, or component library.
