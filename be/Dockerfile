# ============================================================
# CALZADO J&R — Dockerfile Backend (FastAPI + Uvicorn)
# ============================================================
# ¿Qué?    Imagen Docker multi-stage para el backend Python.
# ¿Para?   Empaquetar la aplicación con sus dependencias en una
#           imagen reproducible y ligera (slim).
# ¿Impacto? Elimina el "en mi máquina funciona": todos ejecutan
#           exactamente el mismo Python 3.12, mismas librerías,
#           misma configuración. Multi-stage reduce el tamaño
#           final al separar construcción de ejecución.
# ============================================================

# ────────────────────────────
# Stage 1 — base
# ¿Por qué "slim"? La imagen slim excluye utilidades del SO
# que no necesita una API (compiladores, man pages, etc.),
# reduciendo la superficie de ataque y el tamaño de imagen.
# ────────────────────────────
FROM python:3.12-slim AS base

# PYTHONDONTWRITEBYTECODE=1 → No genera archivos .pyc (bytecode cache).
#   ¿Impacto? Menos archivos en el contenedor; necesario porque el código
#             ya viene copiado/montado y el cache no sirve entre builds.
# PYTHONUNBUFFERED=1 → Los logs (print/logging) se escriben inmediatamente
#   ¿Impacto? Los logs aparecen en tiempo real en `docker compose logs`.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar uv (gestor de dependencias ultra-rápido para Python)
RUN pip install --no-cache-dir uv

# ¿QUE? Copiar pyproject.toml para instalar dependencias
# ¿PARA? Aprovechar caché de Docker: si código cambia pero pyproject.toml no,
#        Docker reutiliza la capa de instalación → builds más rápidos.
# ¿IMPACTO? Declarativo: todas las dependencias están en un solo lugar (pyproject.toml),
#           no en archivos duplicados.
COPY pyproject.toml .
RUN mkdir app && touch app/__init__.py

# ¿QUE? Instalar dependencias con UV (10-100x más rápido que pip)
# ¿PARA? UV es el gestor moderno de Python (como pnpm para Node).
#        Solo UV se usa en este proyecto (no pip, no requirements.txt, no poetry).
# ¿IMPACTO? ÚNICO gestor centralizado = reproducibilidad garantizada
RUN uv pip install --system --no-cache -e .

# ────────────────────────────
# Stage 2 — dev
# ¿Qué?    Target para desarrollo local con Docker Compose.
# ¿Para?   El código se monta como volumen (./be:/app) para
#           que --reload detecte cambios en tiempo real sin
#           reconstruir la imagen.
# ¿Impacto? Ciclo de desarrollo ágil: guardas un archivo → la
#           API se reinicia automáticamente en ~1 segundo.
# ────────────────────────────
FROM base AS dev

EXPOSE 8000

# --reload: Uvicorn reinicia al detectar cambios en archivos Python.
# --host 0.0.0.0: Escucha en todas las interfaces, no solo localhost
#   dentro del contenedor (necesario para que el host pueda conectarse).
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--reload"]

# ────────────────────────────
# Stage 3 — prod
# ¿Qué?    Target para despliegue en producción.
# ¿Para?   Imagen autónoma con el código incluido (sin volúmenes)
#           y múltiples workers para manejar más tráfico.
# ¿Impacto? --workers 2 permite atender 2 peticiones en paralelo.
#           Ajustar según RAM: regla práctica = (2 × CPU cores) + 1.
# ────────────────────────────
FROM base AS prod

# Copiar código fuente dentro de la imagen
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2"]
