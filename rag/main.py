"""
main.py — FastAPI service exposing the RAG pipeline.
Runs ingestion on first startup if the ChromaDB collection is empty.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

import ingest
import rag_chain

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [RAG] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("RAG service starting up …")
    if not rag_chain.is_ready():
        log.info("ChromaDB collection empty — running ingestion …")
        ingest.run()
    else:
        log.info("ChromaDB already populated — skipping ingestion")

    # Pre-warm: load models into memory now so the first request is fast
    try:
        rag_chain._get_vectorstore()
        rag_chain._get_bm25()
        rag_chain._get_llm()
        log.info("RAG pipeline pre-warmed and ready")
    except Exception as e:
        log.error("Pre-warm failed: %s", e)
    yield
    log.info("RAG service shutting down")


app = FastAPI(title="Samvidhan RAG Service", lifespan=lifespan)


# ── Models ────────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    history: list[ChatMessage] = Field(..., min_length=1)


class ChatResponse(BaseModel):
    reply: str
    sources: list[str]
    insufficient: bool


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    ready = rag_chain.is_ready()
    return {"status": "ok" if ready else "not_ready", "vectorstore_ready": ready}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    user_messages = [m for m in req.history if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="No user message found in history")

    query = user_messages[-1].text.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty query")

    log.info("Query: %s", query[:120])

    try:
        result = rag_chain.answer(query)
        return ChatResponse(**result)
    except RuntimeError as e:
        log.error("RAG pipeline error: %s", e)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        log.exception("Unexpected error in /chat")
        raise HTTPException(status_code=500, detail="Internal RAG error")
