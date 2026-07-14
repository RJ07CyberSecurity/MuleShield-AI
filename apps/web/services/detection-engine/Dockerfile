# Multi-stage Dockerfile for FastAPI detection-engine service
FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock* README.md ./

# Configure poetry to not create virtualenvs in container
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root || true

COPY . .

FROM python:3.11-slim AS runner

WORKDIR /app

# Copy python dependencies
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
