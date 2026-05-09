"""
ingest.py — One-time ingestion script.

Downloads the official Constitution of India PDF, chunks it semantically
by Article / Part / Schedule / Amendment boundaries, embeds each chunk
with BAAI/bge-base-en-v1.5, and stores everything in ChromaDB.

Called automatically at RAG service startup when the collection is empty.
"""

import os
import re
import logging
import urllib.request
from pathlib import Path
from typing import Optional

from pypdf import PdfReader
from langchain.schema import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

logging.basicConfig(level=logging.INFO, format="%(asctime)s [INGEST] %(message)s")
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
PDF_URL     = "https://cdnbbsr.s3waas.gov.in/s380537a945c7aaa788ccfcdf1b99b5d8f/uploads/2024/07/20240716890312078.pdf"
PDF_PATH    = Path("/data/constitution.pdf")
CHROMA_DIR  = Path(os.getenv("CHROMA_DIR", "/data/chroma"))
COLLECTION  = "constitution"
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-base-en-v1.5")
MAX_CHUNK_CHARS = 1200

# Regex patterns to detect structural boundaries
PART_RE      = re.compile(r"^\s*PART\s+([IVXLCDM]+)\b", re.IGNORECASE)
ARTICLE_RE   = re.compile(r"^\s*(\d{1,3}[A-Z]?)\.\s{1,4}([A-Z][^\n]{4,79}?)[\.\—\-]?\s*$")
SCHEDULE_RE  = re.compile(
    r"^\s*(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH)\s+SCHEDULE\b",
    re.IGNORECASE,
)
AMENDMENT_RE = re.compile(
    r"^\s*THE\s+CONSTITUTION\s+\((\w[\w\s]*?AMENDMENT)\)\s+ACT",
    re.IGNORECASE,
)


def download_pdf() -> None:
    if PDF_PATH.exists():
        log.info("PDF already present at %s", PDF_PATH)
        return
    PDF_PATH.parent.mkdir(parents=True, exist_ok=True)
    log.info("Downloading Constitution PDF …")
    urllib.request.urlretrieve(PDF_URL, PDF_PATH)
    log.info("Download complete — %d KB", PDF_PATH.stat().st_size // 1024)


def extract_pages() -> list[tuple[int, str]]:
    reader = PdfReader(str(PDF_PATH))
    pages = [(i + 1, page.extract_text() or "") for i, page in enumerate(reader.pages)]
    log.info("Extracted %d pages", len(pages))
    return pages


def _detect_section(line: str) -> Optional[dict]:
    if m := PART_RE.match(line):
        return {"type": "part", "part": m.group(1).upper()}
    if m := SCHEDULE_RE.match(line):
        return {"type": "schedule", "schedule": m.group(1).upper()}
    if m := AMENDMENT_RE.match(line):
        return {"type": "amendment", "amendment": m.group(1)}
    if m := ARTICLE_RE.match(line):
        return {
            "type": "article",
            "article_number": m.group(1),
            "article_title": m.group(2).strip(),
        }
    return None


def chunk_documents(pages: list[tuple[int, str]]) -> list[Document]:
    """
    Walk every line across all pages.
    Flush the current buffer as a Document whenever a new structural
    boundary (Article / Part / Schedule / Amendment) is detected.
    Each Document carries rich metadata for citation.
    """
    documents: list[Document] = []
    current_lines: list[str] = []
    current_meta: dict = {
        "source": "Constitution of India",
        "type": "preamble",
        "part": "PREAMBLE",
        "article_number": "",
        "article_title": "",
        "schedule": "",
        "amendment": "",
        "start_page": 1,
    }

    def flush(end_page: int) -> None:
        text = "\n".join(current_lines).strip()
        if len(text) < 80:
            return
        documents.append(Document(
            page_content=text,
            metadata={**current_meta, "end_page": end_page},
        ))
        current_lines.clear()

    for page_num, page_text in pages:
        for line in page_text.splitlines():
            section = _detect_section(line)
            if section:
                flush(page_num)
                current_meta = {
                    "source": "Constitution of India",
                    "type": section["type"],
                    "part": section.get("part", current_meta.get("part", "")),
                    "article_number": section.get("article_number", ""),
                    "article_title": section.get("article_title", ""),
                    "schedule": section.get("schedule", ""),
                    "amendment": section.get("amendment", ""),
                    "start_page": page_num,
                }
            current_lines.append(line)

    flush(pages[-1][0])

    # Secondary split: chunks over MAX_CHUNK_CHARS split at paragraph boundaries
    final_docs: list[Document] = []
    for doc in documents:
        if len(doc.page_content) <= MAX_CHUNK_CHARS:
            final_docs.append(doc)
            continue
        paragraphs = re.split(r"\n{2,}", doc.page_content)
        buffer: list[str] = []
        buf_len = 0
        chunk_idx = 0
        for para in paragraphs:
            if buf_len + len(para) > MAX_CHUNK_CHARS and buffer:
                final_docs.append(Document(
                    page_content="\n\n".join(buffer),
                    metadata={**doc.metadata, "chunk_index": chunk_idx},
                ))
                buffer, buf_len, chunk_idx = [], 0, chunk_idx + 1
            buffer.append(para)
            buf_len += len(para)
        if buffer:
            final_docs.append(Document(
                page_content="\n\n".join(buffer),
                metadata={**doc.metadata, "chunk_index": chunk_idx},
            ))

    log.info("Created %d semantic chunks", len(final_docs))
    return final_docs


def build_vectorstore(docs: list[Document]) -> None:
    log.info("Loading embedding model: %s", EMBED_MODEL)
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    log.info("Building ChromaDB collection '%s' …", COLLECTION)
    vs = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        collection_name=COLLECTION,
        persist_directory=str(CHROMA_DIR),
    )
    log.info("Vectorstore ready — %d vectors stored", vs._collection.count())


def run() -> None:
    download_pdf()
    pages = extract_pages()
    docs  = chunk_documents(pages)
    build_vectorstore(docs)
    log.info("Ingestion complete.")


if __name__ == "__main__":
    run()
