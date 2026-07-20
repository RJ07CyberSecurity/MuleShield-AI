# Stage 1: Build dependencies and package
FROM python:3.13-slim AS builder

WORKDIR /app

# Install system dependencies & Poetry
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && pip install --no-cache-dir poetry \
    && rm -rf /var/lib/apt/lists/*

# Copy the shared package and customer package into builder
COPY shared/ shared/
COPY services/customer-service/ services/customer-service/

# Build and install dependencies for the service
WORKDIR /app/services/customer-service
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root \
    && pip install asyncpg

# Stage 2: Minimal runtime image
FROM python:3.13-slim AS runner

WORKDIR /app/services/customer-service

# Copy installed dependencies and executable files from builder
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Execute app via uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
