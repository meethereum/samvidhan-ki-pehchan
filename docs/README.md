# Samvidhan Ki Pehchan — Documentation

## Documents

| File | Covers |
|---|---|
| [architecture.md](./architecture.md) | Services, data flow, timeouts, volumes |
| [rag-service.md](./rag-service.md) | Ingestion, hybrid retrieval, Mistral generation, config |
| [getting-started.md](./getting-started.md) | Setup, first run, dev workflow |

## Quick Start

```bash
cp .env.example .env        # add MISTRAL_API_KEY
docker compose up --build   # first boot takes 3–8 min (model download)
```

Open `http://localhost` — login: `admin` / `admin123`

## Stack

| Layer | Tech |
|---|---|
| Frontend | Angular 21, Nginx |
| Backend | Node 22, Express 5, TypeScript |
| RAG | Python 3.11, FastAPI, LangChain 0.3, Mistral API |
| Embeddings | BAAI/bge-base-en-v1.5 (sentence-transformers) |
| Vector store | ChromaDB |
| Database | PostgreSQL 15 |
