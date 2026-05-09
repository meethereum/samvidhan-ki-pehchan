# Getting Started

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)
- A [Mistral API key](https://console.mistral.ai/) — free tier is sufficient
- Git

## Setup

### 1. Clone and configure

```bash
git clone <repo-url>
cd samvidhan-ki-pehchan

cp .env.example .env
```

Open `.env` and add your Mistral API key:

```
MISTRAL_API_KEY=your_key_here
```

### 2. Start everything

```bash
docker compose up --build
```

**First boot takes 3–8 minutes** because:
- PyTorch and sentence-transformers are installed (~700 MB)
- The BGE embedding model is downloaded into the image
- The Constitution PDF is downloaded and embedded into ChromaDB

Subsequent starts are fast — the `ragdata` volume caches everything.

### 3. Open the app

Navigate to `http://localhost` and log in with:

- Username: `admin`
- Password: `admin123`

---

## Development Workflow

Use `dev.sh` to rebuild only the service you changed:

```bash
# Rebuild only what changed (detected via git)
./dev.sh

# Rebuild a specific service
./dev.sh frontend
./dev.sh backend
./dev.sh rag

# Rebuild everything
./dev.sh all

# Tail logs
./dev.sh logs

# Check container status
./dev.sh status
```

`dev.sh` also audits `.dockerignore` files to catch the common mistake of accidentally excluding source files from the build context.

### Force a clean build (no Docker cache)

```bash
NO_CACHE=1 ./dev.sh rag
```

---

## Resetting Data

### Reset the database (users)

```bash
docker compose down
docker volume rm samvidhan-ki-pehchan_pgdata
docker compose up
```

### Reset the RAG index (re-run ingestion)

```bash
docker compose down
docker volume rm samvidhan-ki-pehchan_ragdata
docker compose up
```

This forces a fresh PDF download and re-embedding on next startup.

---

## Changing the Default Password

The default `admin/admin123` user is seeded in `backend/src/init-db.ts`. To change it:

1. Edit the `password` constant in `init-db.ts`
2. Reset the database volume (see above)
3. Rebuild the backend: `./dev.sh backend`

---

## Ports

| Service | Host Port | Container Port |
|---|---|---|
| Frontend (Nginx) | 80 | 80 |
| Backend (Express) | 3000 | 3000 |
| RAG (FastAPI) | 8000 | 8000 |
| PostgreSQL | 5433 | 5432 |

The RAG service port (8000) is exposed for debugging. In production, remove it from `docker-compose.yml`.
