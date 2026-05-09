# RAG Service

Python 3.11 / FastAPI. Source: `rag/`

## Files

| File | Purpose |
|---|---|
| `main.py` | FastAPI app, startup lifecycle, `/health` and `/chat` endpoints |
| `ingest.py` | One-time PDF download, chunking, embedding, ChromaDB storage |
| `rag_chain.py` | 2-step hybrid retrieval + Mistral generation pipeline |
| `requirements.txt` | Python dependencies |
| `Dockerfile` | Uses `uv` + BuildKit cache mount to speed up PyTorch installs |

---

## Ingestion (`ingest.py`)

Runs automatically on startup if ChromaDB is empty. Safe to re-run — idempotent.

### Steps

**1. Download PDF**
```python
urllib.request.urlretrieve(PDF_URL, "/data/constitution.pdf")
```
Skipped if file already exists.

**2. Extract pages**
```python
PdfReader(pdf_path)  # returns (page_number, text) per page
```

**3. Semantic chunking**

Walks every line. When a structural boundary is detected, the current buffer is flushed as a `Document` with metadata.

Boundary patterns (regex):
- `PART IV` → `{"type": "part", "part": "IV"}`
- `21. Protection of Life...` → `{"type": "article", "article_number": "21", "article_title": "..."}`
- `THIRD SCHEDULE` → `{"type": "schedule", "schedule": "THIRD"}`
- `THE CONSTITUTION (42ND AMENDMENT) ACT` → `{"type": "amendment", ...}`

Secondary split: chunks over 1200 chars are split further at paragraph boundaries.

Each `Document` carries metadata: `article_number`, `article_title`, `part`, `schedule`, `amendment`, `start_page`, `end_page`.

**4. Embed + store**
```python
HuggingFaceEmbeddings(model_name="BAAI/bge-base-en-v1.5", normalize_embeddings=True)
Chroma.from_documents(docs, embeddings, collection_name="constitution", persist_directory="/data/chroma")
```

---

## RAG Pipeline (`rag_chain.py`)

### Step 1 — Hybrid Retrieval

```
Query
  ├── Semantic search  → ChromaDB.similarity_search(query, k=6)
  └── Keyword search   → BM25Okapi.get_scores(tokens) → top 6 docs

Both lists → Reciprocal Rank Fusion (k=60) → top 4 documents
```

**Why hybrid?** Semantic search finds conceptually related chunks. BM25 finds exact keyword matches (e.g. "Article 21A"). RRF merges both without needing to tune weights.

**RRF formula:** `score = Σ 1 / (60 + rank_i)` across both lists.

### Step 2 — Grounded Generation

Retrieved docs are formatted into a numbered context block:
```
[1] Article 21 — Protection of Life and Personal Liberty (Part III) p.42
<chunk text>

---

[2] Article 21A — Right to Education (Part III) p.43
<chunk text>
```

Context is capped at 3500 chars to keep Mistral latency predictable.

The prompt enforces strict grounding:
- Answer **only** from the provided context
- Return `INSUFFICIENT_CONTEXT` if context is inadequate
- Always cite Article numbers and Parts
- Temperature: `0.05` (near-deterministic)

### Response Shape

```json
{
  "reply": "**Answer:** ...\n\n**Constitutional References:** ...\n\n**Supporting Excerpts:**\n> ...",
  "sources": ["Article 21 — Protection of Life (Part III)", "Article 21A — Right to Education (Part III)"],
  "insufficient": false
}
```

If `insufficient: true`, the reply is a clean fallback message — the LLM never guesses.

---

## Singleton State

All heavy objects (embeddings model, vectorstore, BM25 index, LLM) are module-level singletons loaded lazily on first use and pre-warmed at startup. This means:
- First request after a cold start is fast (models already in memory)
- No per-request model loading overhead

---

## Config (Environment Variables)

| Variable | Default | Description |
|---|---|---|
| `MISTRAL_API_KEY` | — | **Required.** Mistral API key |
| `MISTRAL_MODEL` | `mistral-small-latest` | Mistral model name |
| `MISTRAL_TIMEOUT` | `90` | Seconds before Mistral call times out |
| `EMBED_MODEL` | `BAAI/bge-base-en-v1.5` | HuggingFace embedding model |
| `CHROMA_DIR` | `/data/chroma` | ChromaDB persistence directory |
| `TOP_K_SEMANTIC` | `6` | Docs returned by semantic search |
| `TOP_K_BM25` | `6` | Docs returned by BM25 search |
| `TOP_K_FINAL` | `4` | Docs passed to LLM after RRF |

---

## Build Optimisation

The Dockerfile uses two tricks to avoid re-downloading PyTorch (700 MB) on every build:

1. **`uv`** — Rust-based pip replacement, ~10x faster dependency resolution.
2. **BuildKit cache mount** — Keeps downloaded wheels on the host machine permanently:
   ```dockerfile
   RUN --mount=type=cache,target=/root/.cache/uv \
       uv pip install --system --no-cache -r requirements.txt
   ```
   Even `docker compose build --no-cache rag` reuses the cached wheels after the first build.
