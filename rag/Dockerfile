FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv — fast Rust-based pip replacement
RUN pip install --no-cache-dir uv

# Install Python dependencies.
# - uv resolves and installs ~10x faster than pip
# - BuildKit cache mount keeps downloaded wheels on the host between builds,
#   so even a full image rebuild skips re-downloading PyTorch (700 MB)
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache -r requirements.txt

# Pre-download the BGE embedding model into the image layer
# so the first request doesn't stall on a cold model download
RUN python -c "\
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('BAAI/bge-base-en-v1.5')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
