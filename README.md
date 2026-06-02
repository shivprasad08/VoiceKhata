# VoiceKhata Demo Environment

VoiceKhata is an AI-powered ledger (khata) system for Indian kirana store owners. This repository contains the complete local hackathon demo environment, configured for instant deployment.

## Quick Start (One-Command Setup)

For judges and developers running this locally, you only need one command. Ensure you have Docker and Docker Compose installed.

```bash
docker-compose up -d --build
```

### What this does:
1. **PostgreSQL** spins up on port `5432` with a persistent volume.
2. **FastAPI Backend** starts on port `8000`. Upon startup, it automatically checks the database connection, runs the latest Alembic schema migrations, and injects 30 days of seed data (because `DEMO_MODE=true` is set).
3. **React Frontend** starts on port `3000`. It proxies `/api` and `/ws` requests directly to the backend.
4. **pgAdmin** spins up on port `5050` for easy database inspection.

### Accessing the Application
- **Live Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database GUI (pgAdmin)**: [http://localhost:5050](http://localhost:5050)
  - **Email**: `admin@voicekhata.com`
  - **Password**: `admin`

## Demo Mode

The `.env.demo` variables are automatically injected via Docker Compose.
The critical flag is `DEMO_MODE=true`. 
- **Auto-Seeding**: When the FastAPI server starts, if it detects an empty database, it instantly runs `seed.py` to generate the demo user and 30 days of realistic transactions.
- **Auth Bypass**: It uses a fixed demo UUID (`11111111-1111-1111-1111-111111111111`) so the dashboard works instantly without a login wall.

If you ever want to reset the data, simply delete the Docker volume (`docker-compose down -v`) and run `docker-compose up` again.

## Deployment to Railway

This repository is configured for automated CI/CD to Railway.
- **railway.toml**: Specifies the build and start commands for the FastAPI app.
- **GitHub Actions**: The `.github/workflows/deploy.yml` workflow automatically deploys to Railway on every push to the `main` branch, provided the `RAILWAY_TOKEN` secret is set in your GitHub repository.
