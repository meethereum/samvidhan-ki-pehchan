"""
rag_chain.py — 2-step RAG pipeline.

Step 1 — Hybrid Retrieval:
  a) Semantic search via ChromaDB (BGE embeddings, cosine similarity)
  b) BM25 keyword search over the same corpus
  c) Reciprocal Rank Fusion to merge both result lists

Step 2 — Grounded Generation:
  Mistral LLM at temperature=0.05 with a strict grounding prompt.
  Refuses to answer if retrieved context is insufficient.
  Always cites Article numbers and Parts.
"""

import os
import logging
import httpx
from typing import Optional

from langchain.schema import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_mistralai import ChatMistralAI
from langchain.prompts import ChatPromptTemplate
from rank_bm25 import BM25Okapi

log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
CHROMA_DIR    = os.getenv("CHROMA_DIR", "/data/chroma")
COLLECTION    = "constitution"
EMBED_MODEL   = os.getenv("EMBED_MODEL", "BAAI/bge-base-en-v1.5")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
TOP_K_SEMANTIC    = int(os.getenv("TOP_K_SEMANTIC", "6"))
TOP_K_BM25        = int(os.getenv("TOP_K_BM25", "6"))
TOP_K_FINAL       = int(os.getenv("TOP_K_FINAL", "4"))
MIN_CONTEXT_CHARS = 200
MAX_CONTEXT_CHARS = 3500   # cap context sent to Mistral to keep latency low
MISTRAL_TIMEOUT   = int(os.getenv("MISTRAL_TIMEOUT", "90"))

# ── Grounding prompt ──────────────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are Samvidhan Mitra, an educational assistant for the Constitution of India.

STRICT RULES — follow every rule without exception:
1. Answer ONLY using the CONTEXT provided below. Do not use any external knowledge.
2. If the context does not contain enough information to answer confidently, respond with exactly:
   INSUFFICIENT_CONTEXT
3. Never speculate, infer beyond the text, or cite sources not present in the context.
4. Always cite the specific Article number(s) and Part(s) from the context.
5. This is educational guidance only — never present it as legal advice.
6. Keep the answer factual, concise, and in simple language.
7. If the user writes in Hindi, respond in Hindi.

RESPONSE FORMAT (always use this structure):
**Answer:** <direct answer based solely on context>

**Constitutional References:** <Article X, Part Y — one line each>

**Supporting Excerpts:**
> <verbatim or near-verbatim quote from context, max 2 sentences>

---
CONTEXT:
{context}
"""

# ── Singleton state ───────────────────────────────────────────────────────────
_embeddings: Optional[HuggingFaceEmbeddings] = None
_vectorstore: Optional[Chroma] = None
_bm25: Optional[BM25Okapi] = None
_bm25_docs: list[Document] = []
_llm: Optional[ChatMistralAI] = None
_prompt: Optional[ChatPromptTemplate] = None


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        log.info("Loading embedding model: %s", EMBED_MODEL)
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBED_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def _get_vectorstore() -> Chroma:
    global _vectorstore
    if _vectorstore is None:
        log.info("Connecting to ChromaDB at %s", CHROMA_DIR)
        _vectorstore = Chroma(
            collection_name=COLLECTION,
            embedding_function=_get_embeddings(),
            persist_directory=CHROMA_DIR,
        )
        count = _vectorstore._collection.count()
        log.info("ChromaDB collection '%s' has %d vectors", COLLECTION, count)
        if count == 0:
            raise RuntimeError("ChromaDB collection is empty — run ingestion first")
    return _vectorstore


def _get_bm25() -> tuple[BM25Okapi, list[Document]]:
    global _bm25, _bm25_docs
    if _bm25 is None:
        vs = _get_vectorstore()
        result = vs._collection.get(include=["documents", "metadatas"])
        _bm25_docs = [
            Document(page_content=text, metadata=meta)
            for text, meta in zip(result["documents"], result["metadatas"])
        ]
        tokenized = [doc.page_content.lower().split() for doc in _bm25_docs]
        _bm25 = BM25Okapi(tokenized)
        log.info("BM25 index built over %d documents", len(_bm25_docs))
    return _bm25, _bm25_docs


def _get_llm() -> ChatMistralAI:
    global _llm
    if _llm is None:
        api_key = os.getenv("MISTRAL_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("MISTRAL_API_KEY environment variable is not set")
        _llm = ChatMistralAI(
            model=MISTRAL_MODEL,
            mistral_api_key=api_key,
            temperature=0.05,
            max_tokens=1024,
            timeout=MISTRAL_TIMEOUT,
        )
        log.info("Mistral LLM ready: %s", MISTRAL_MODEL)
    return _llm


def _get_prompt() -> ChatPromptTemplate:
    global _prompt
    if _prompt is None:
        _prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("human",  "{question}"),
        ])
    return _prompt


def _rrf(
    semantic_docs: list[Document],
    bm25_docs: list[Document],
    k: int = 60,
    top_n: int = TOP_K_FINAL,
) -> list[Document]:
    """Reciprocal Rank Fusion — merge two ranked lists."""
    scores: dict[str, float] = {}
    doc_map: dict[str, Document] = {}

    for rank, doc in enumerate(semantic_docs, start=1):
        key = doc.page_content[:120]
        scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)
        doc_map[key] = doc

    for rank, doc in enumerate(bm25_docs, start=1):
        key = doc.page_content[:120]
        scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank)
        doc_map[key] = doc

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [doc_map[key] for key, _ in ranked[:top_n]]


def _format_context(docs: list[Document]) -> str:
    parts = []
    for i, doc in enumerate(docs, start=1):
        m = doc.metadata
        label_parts = []
        if m.get("article_number"):
            label_parts.append(f"Article {m['article_number']}")
            if m.get("article_title"):
                label_parts.append(f"— {m['article_title']}")
        if m.get("part"):
            label_parts.append(f"(Part {m['part']})")
        if m.get("schedule"):
            label_parts.append(f"[{m['schedule']} Schedule]")
        if m.get("amendment"):
            label_parts.append(f"[{m['amendment']}]")
        if m.get("start_page"):
            label_parts.append(f"p.{m['start_page']}")
        label = " ".join(label_parts) if label_parts else f"Chunk {i}"
        parts.append(f"[{i}] {label}\n{doc.page_content.strip()}")
    return "\n\n---\n\n".join(parts)


# ── Public API ────────────────────────────────────────────────────────────────
def is_ready() -> bool:
    try:
        vs = _get_vectorstore()
        return vs._collection.count() > 0
    except Exception:
        return False


def retrieve(query: str) -> list[Document]:
    """Hybrid retrieval: semantic + BM25 → RRF fusion."""
    vs = _get_vectorstore()
    semantic_results = vs.similarity_search(query, k=TOP_K_SEMANTIC)

    bm25, all_docs = _get_bm25()
    tokens = query.lower().split()
    bm25_scores = bm25.get_scores(tokens)
    top_bm25_idx = sorted(
        range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True
    )[:TOP_K_BM25]
    bm25_results = [all_docs[i] for i in top_bm25_idx]

    fused = _rrf(semantic_results, bm25_results)
    log.debug(
        "Retrieval: %d semantic + %d BM25 → %d fused",
        len(semantic_results), len(bm25_results), len(fused),
    )
    return fused


def answer(query: str) -> dict:
    """Full 2-step RAG pipeline. Returns dict: reply, sources, insufficient."""
    docs    = retrieve(query)
    context = _format_context(docs)

    # Trim context to MAX_CONTEXT_CHARS to keep Mistral latency predictable
    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + "\n\n[context trimmed for length]"

    if len(context.strip()) < MIN_CONTEXT_CHARS:
        log.warning("Context too thin for query: %s", query[:80])
        return {
            "reply": (
                "I don't have sufficient information in the Constitution text "
                "to answer this question reliably. Please rephrase or ask about "
                "a specific Article, Part, or constitutional provision."
            ),
            "sources": [],
            "insufficient": True,
        }

    llm    = _get_llm()
    prompt = _get_prompt()
    chain  = prompt | llm

    log.info("Calling Mistral — context: %d chars, timeout: %ds", len(context), MISTRAL_TIMEOUT)
    try:
        response = chain.invoke({"context": context, "question": query})
    except (httpx.ReadTimeout, httpx.TimeoutException) as e:
        log.error("Mistral API timed out after %ds: %s", MISTRAL_TIMEOUT, e)
        return {
            "reply": (
                "The AI service took too long to respond. "
                "Please try again — if the problem persists, try a shorter or simpler question."
            ),
            "sources": [],
            "insufficient": False,
        }
    except httpx.HTTPStatusError as e:
        log.error("Mistral API HTTP error %d: %s", e.response.status_code, e)
        return {
            "reply": "The AI service returned an error. Please try again in a moment.",
            "sources": [],
            "insufficient": False,
        }
    except Exception as e:
        log.error("Mistral API unexpected error: %s", e)
        raise

    reply_text: str = response.content.strip()

    if "INSUFFICIENT_CONTEXT" in reply_text:
        return {
            "reply": (
                "I couldn't find reliable constitutional context to answer this. "
                "Try asking about a specific Article, Fundamental Right, Directive Principle, "
                "or constitutional amendment."
            ),
            "sources": [],
            "insufficient": True,
        }

    # Build deduplicated source citations
    seen: set[str] = set()
    sources: list[str] = []
    for doc in docs:
        m = doc.metadata
        if m.get("article_number"):
            ref = f"Article {m['article_number']}"
            if m.get("article_title"):
                ref += f" — {m['article_title']}"
            if m.get("part"):
                ref += f" (Part {m['part']})"
        elif m.get("schedule"):
            ref = f"{m['schedule']} Schedule"
        elif m.get("amendment"):
            ref = m["amendment"]
        else:
            continue
        if ref not in seen:
            seen.add(ref)
            sources.append(ref)

    return {"reply": reply_text, "sources": sources, "insufficient": False}
