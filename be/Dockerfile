# ============================================================
# CALZADO J&R — Dockerfile Backend (FastAPI + Uvicorn)
# ============================================================
# Usa UV como gestor de dependencias (único en todo el proyecto).
# UV es 10-100x más rápido que pip y compatible con pyproject.toml.
# ============================================================

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar UV (gestor de dependencias ultra-rápido)
RUN pip install --no-cache-dir uv

# Copiar solo pyproject.toml para instalar dependencias (aprovecha caché de Docker)
COPY pyproject.toml .
RUN mkdir -p app && touch app/__init__.py

# Instalar dependencias con UV
RUN uv pip install --system --no-cache -e .

# ────────────────────────────
# Stage 2 — dev
# ────────────────────────────
FROM base AS dev

EXPOSE 8000

CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--reload"]

# ────────────────────────────
# Stage 3 — prod
# ────────────────────────────
FROM base AS prod

COPY . .

EXPOSE 8000

ENTRYPOINT ["sh", "-c", "\
  echo '🔄 Ejecutando migraciones Alembic...'; \
  alembic upgrade head; \
  echo '✅ Migraciones completadas'; \
  echo '🚀 Iniciando Uvicorn...'; \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 \
  "]
