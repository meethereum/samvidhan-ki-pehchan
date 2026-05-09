# Architecture

## Services

```
Browser → Nginx (80) → Express Backend (3000) → FastAPI RAG (8000)
                              ↓
                       PostgreSQL (5432)
```

- **Frontend** — Angular 21 SPA served by Nginx. Proxies `/api/*` to the backend.
- **Backend** — Express 5 / Node 22. Handles auth, then forwards chat to the RAG service.
- **RAG** — FastAPI / Python 3.11. Runs ingestion on first boot, then serves hybrid retrieval + Mistral generation.
- **DB** — PostgreSQL 15. Stores only the `users` table.

## Chat Request Flow

```
1. POST /api/chat  (browser → backend, Basic auth header)
2. Backend validates credentials against PostgreSQL
3. Backend forwards history → POST http://rag:8000/chat
4. RAG runs 2-step pipeline (see rag-service.md)
5. Reply bubbles back: RAG → backend → browser
```

## First-Boot Ingestion Flow

```
1. RAG container starts
2. ChromaDB collection empty? → run ingest.run()
   a. Download Constitution PDF → /data/constitution.pdf
   b. Extract pages with pypdf
   c. Chunk by Article/Part/Schedule/Amendment boundaries
   d. Embed with BAAI/bge-base-en-v1.5
   e. Store in ChromaDB at /data/chroma
3. Pre-warm models in memory
4. /health returns ok → backend starts
```

`/data` is a Docker volume — ingestion only runs once.

## Timeout Layers

| Layer | Timeout | Where |
|---|---|---|
| Browser fetch | 30s | `AbortSignal.timeout` in `sendChat()` |
| Backend route | 110s | `setTimeout` in `/api/chat` handler |
| RAG → Mistral | 90s | `ChatMistralAI(timeout=90)` |
| Backend → RAG | 100s | `AbortSignal.timeout` in `ai-service.ts` |

Innermost fires first, outer layers are safety nets.

## Volumes

| Volume | Contents |
|---|---|
| `pgdata` | PostgreSQL data |
| `ragdata` | Constitution PDF + ChromaDB vectors |

To reset the RAG index: `docker volume rm samvidhan-ki-pehchan_ragdata`
