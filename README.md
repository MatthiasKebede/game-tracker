# game-tracker

A single-user web app for tracking games owned across multiple platforms. See [PLAN.md](PLAN.md) for the design and milestones.

## Requirements

- JDK 25
- Docker Desktop (running)

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

## Running the tests

```powershell
cd backend
.\mvnw.cmd test
```

Tests use Testcontainers to start a throwaway Postgres container, so they never touch the development database.

## Data

The library lives in the Docker volume `game-tracker_pgdata`. `docker compose down -v` deletes it.
