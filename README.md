# game-tracker

A single-user web app for tracking games owned across multiple platforms. See [PLAN.md](PLAN.md) for the design and milestones.

## Requirements

- JDK 25
- Docker Desktop (running)
- Node.js 20.19 or newer (developed on 24) with npm

## Running the backend

1. Copy `.env.example` to `.env` in the repo root and set a password.
2. Start the app from the `backend` folder:

   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

   This starts the Postgres container from `docker-compose.yml` (host port 5433), applies the Flyway migrations, and serves the API on port 8080.

3. Check that it is up:

   - http://localhost:8080/actuator/health
   - http://localhost:8080/api/status

## Running the frontend

The frontend is a React app in `frontend/`, built with Vite, TypeScript, and Tailwind. Start the backend first, then in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The page lists the library one row per game and platform, with search, a series filter, platform and status filters that each accept several values, sortable columns, and dialogs to add, edit, and delete games and entries. A button in the top bar switches between a light and a dark theme.

### How the browser reaches the API

The page is served from port 5173 and the API runs on port 8080. Browsers treat those as different origins and block JavaScript on one from calling the other unless the server opts in with CORS (Cross-Origin Resource Sharing) headers.

This project avoids the problem in development with a proxy instead. `frontend/vite.config.ts` tells the Vite dev server to forward every request under `/api` to `http://localhost:8080`. The browser only ever talks to port 5173, so no CORS configuration is needed in the backend.

## API

| Method and path | Purpose |
|---|---|
| `GET /api/platforms` | List platforms |
| `GET /api/games` | List games with their entries |
| `GET /api/games/{id}` | One game with its entries |
| `POST /api/games` | Create a game |
| `PUT /api/games/{id}` | Update a game's name, series, and rating |
| `DELETE /api/games/{id}` | Delete a game and its entries |
| `POST /api/games/{gameId}/entries` | Add the game to a platform |
| `PUT /api/entries/{id}` | Update an entry's status and playtime |
| `DELETE /api/entries/{id}` | Remove an entry |

Example in PowerShell:

```powershell
$game = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/games `
    -ContentType "application/json" -Body '{"name": "Celeste", "rating": 8}'

Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/games/$($game.id)/entries" `
    -ContentType "application/json" -Body '{"platformId": 1, "status": "PLAYING", "playtimeMinutes": 90}'

Invoke-RestMethod http://localhost:8080/api/games
```

`status` is one of `NOT_STARTED`, `PLAYING`, `FINISHED`, `COMPLETED`, `DROPPED`. Rating is a whole number from 1 to 10, or left out. Errors are returned as `application/problem+json`.

## Running the tests

```powershell
cd backend
.\mvnw.cmd test
```

Tests use Testcontainers to start a throwaway Postgres container, so they never touch the development database.

Frontend checks, run from `frontend/`:

```powershell
npm run lint
npm run build
npm test
```

`npm run build` includes the TypeScript type check. `npm test` runs the Vitest suite, which fakes the API and needs neither the backend nor Docker.

## Data

The library lives in the Docker volume `game-tracker_pgdata`. `docker compose down -v` deletes it.
