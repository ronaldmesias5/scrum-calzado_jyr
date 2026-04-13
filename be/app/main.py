"""
Módulo: main.py
Descripción: Punto de entrada de la aplicación FastAPI — configura y arranca el servidor.
¿Para qué? Crear la instancia principal de FastAPI, configurar CORS, incluir routers.
¿Impacto? Este es el archivo que Uvicorn ejecuta. Sin él, no hay servidor.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.admin.router import router as admin_router
from app.modules.admin.catalog_router import router as admin_catalog_router
from app.modules.type_document.router import router as type_document_router
from app.modules.dashboard_jefe.router import router as dashboard_jefe_router
from app.modules.orders.router import router as orders_router
from app.modules.catalog.router import router as catalog_router
from app.modules.supplies.router import router as supplies_router

# Importar middlewares de seguridad (OWASP Top 10)
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

# Importar modelos para que SQLAlchemy los registre en Base.metadata
from app.models import role, user, password_reset_token, type_document, order, category, brand, style, product, supplies, product_supplies  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Gestiona el ciclo de vida de la aplicación FastAPI."""
    print("🚀 CALZADO J&R — Backend iniciando...")
    
    # ══════════════════════════════════════════════════════════
    # PASO 1: Ejecutar migraciones Alembic
    # ══════════════════════════════════════════════════════════
    # ¿Por qué migraciones?
    #   - Version control del esquema de BD
    #   - Reproducible en cualquier máquina
    #   - Reversible (downgrade)
    #   - Permite auditar cambios de esquema en git
    #
    # ¿Por qué NO Base.metadata.create_all()?
    #   - No versionado
    #   - No reproducible (depende del estado del ORM)
    #   - Sin historial de cambios
    # ══════════════════════════════════════════════════════════
    from app.init_db import run_migrations
    run_migrations(settings.DATABASE_URL)
    print("✅ Migraciones Alembic aplicadas correctamente.")
    
    # ══════════════════════════════════════════════════════════
    # PASO 2: Verificar datos iniciales (fallback)
    # ══════════════════════════════════════════════════════════
    # Las migraciones ya insertan datos iniciales (roles, tipos doc, usuarios).
    # Esta verificación es un fallback por si algo falla.
    db = SessionLocal()
    try:
        from app.init.seed_data import seed_all
        seed_all(db)
    except Exception as e:
        print(f"⚠️  Error en verificación de datos iniciales: {str(e)}")
    finally:
        db.close()
    
    print(f"📡 CORS habilitado para: {settings.FRONTEND_URL}")
    print("✨ Sistema listo.")
    
    yield
    
    print("🛑 CALZADO J&R — Backend cerrando...")


app = FastAPI(
    title="CALZADO J&R API",
    description=(
        "👟 Sistema de gestión y producción de calzado. "
        "Incluye registro, login, cambio y recuperación de contraseña. "
        "Proyecto educativo — SENA."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ────────────────────────────
# 🔒 MIDDLEWARES DE SEGURIDAD (OWASP Top 10)
# ────────────────────────────
# Orden de ejecución (abajo → arriba):
# 1. ErrorHandlerMiddleware: Captura excepciones no manejadas
# 2. RateLimitMiddleware: Limita intentos de fuerza bruta
# 3. SecurityHeadersMiddleware: Agrega headers de seguridad
# 4. CORSMiddleware: Valida origen CORS

app.add_middleware(CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

# ────────────────────────────
# � Archivos estáticos (imágenes de productos)
# ────────────────────────────
_uploads_path = Path("/app/uploads")
_uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_path)), name="uploads")

# ────────────────────────────
# 📍 Incluir routers
# ────────────────────────────

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(admin_catalog_router)
app.include_router(type_document_router)
app.include_router(dashboard_jefe_router)
app.include_router(orders_router)
app.include_router(catalog_router)
app.include_router(supplies_router)

# ────────────────────────────
# 📍 Endpoint raíz de bienvenida
# ────────────────────────────
@app.get("/", tags=["root"], summary="Bienvenida API")
async def root():
    """Mensaje de bienvenida en la raíz de la API."""
    return {"message": "API de Calzado J&R funcionando. Visita /docs para la documentación."}


# ────────────────────────────
# 📍 Endpoint de salud (health check)
# ────────────────────────────
@app.get(
    "/api/v1/health",
    tags=["health"],
    summary="Verificar estado del servidor",
)
async def health_check() -> dict[str, str]:
    """Endpoint de verificación de salud del servidor."""
    return {
        "status": "healthy",
        "project": "CALZADO J&R",
        "version": "0.1.0",
    }


# ────────────────────────────
# 📍 Endpoint para servir imágenes (con CORS explícito)
# ────────────────────────────
from fastapi.responses import FileResponse
import os

@app.get(
    "/api/v1/uploads/{file_path:path}",
    tags=["uploads"],
    summary="Servir imagen con CORS",
    include_in_schema=False,
)
async def serve_image(file_path: str):
    """Sirve una imagen desde el directorio de uploads con CORS explícito."""
    file_location = Path(f"/app/uploads/{file_path}")
    
    # Seguridad: prevenir path traversal
    if not file_location.resolve().is_relative_to(Path("/app/uploads").resolve()):
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    if not file_location.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    return FileResponse(
        path=file_location,
        headers={
            "Access-Control-Allow-Origin": settings.FRONTEND_URL,
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": "inline",
        }
    )
