"""
Módulo: main.py
Descripción: Punto de entrada de la aplicación FastAPI — configura y arranca el servidor.
¿Para qué? Crear la instancia principal de FastAPI, configurar CORS, incluir routers.
¿Impacto? Este es el archivo que Uvicorn ejecuta. Sin él, no hay servidor.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import SessionLocal

# Importar middlewares de seguridad (OWASP Top 10)
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.csrf import CSRFMiddleware

# Importar modelos para que SQLAlchemy los registre en Base.metadata
from app.models import (  # noqa: F401
    brand,
    category,
    order,
    password_reset_token,
    product,
    product_supplies,
    role,
    scrap,
    style,
    supplies,
    type_document,
    user,
)
from app.routers.auth import router as auth_router
from app.routers.bulk_import import router as bulk_import_router
from app.routers.catalog_brands import router as catalog_brands_router
from app.routers.catalog_inventory import router as catalog_inventory_router
from app.routers.catalog_products import router as catalog_products_router
from app.routers.catalog import router as catalog_router
from app.routers.catalog_styles import router as catalog_styles_router
from app.routers.client import router as client_router
from app.routers.dashboard_empleado import router as dashboard_empleado_router
from app.routers.dashboard_jefe import router as dashboard_jefe_router
from app.routers.notifications import router as notifications_router
from app.routers.orders import router as orders_router
from app.routers.orders_tasks import router as orders_tasks_router
from app.routers.reports import router as reports_router
from app.routers.scrap import router as scrap_router
from app.routers.supplies import router as supplies_router
from app.routers.type_document import router as type_document_router
from app.routers.admin import router as admin_router
from app.routers.users import router as users_router


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
        print(f"⚠️  Error en verificación de datos iniciales: {e!s}")
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


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(CSRFMiddleware)

# CORSMiddleware debe ser el último (el más externo) para manejar OPTIONS correctamente
app.add_middleware(CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        *([] if settings.ENVIRONMENT == "production" else [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:8081",
        ]),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)


# ────────────────────────────
# 🧯 Errores de validación (sin exponer detalles internos en producción)
# ────────────────────────────
# FastAPI maneja RequestValidationError ANTES de que llegue al middleware,
# así que registramos un handler explícito para controlar la respuesta.
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    content = {"detail": "Los datos enviados son incorrectos"}
    if settings.ENVIRONMENT != "production":
        content["errors"] = jsonable_encoder(exc.errors())
    return JSONResponse(status_code=422, content=content)

# ────────────────────────────
# � Archivos estáticos (imágenes de productos)
# ────────────────────────────
_uploads_path = Path(settings.UPLOAD_DIR) if settings.UPLOAD_DIR else Path(__file__).resolve().parent.parent / "uploads"
_uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads_path)), name="uploads")

# ────────────────────────────
# 📍 Incluir routers
# ────────────────────────────

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(catalog_brands_router)
app.include_router(catalog_styles_router)
app.include_router(catalog_products_router)
app.include_router(catalog_inventory_router)
app.include_router(type_document_router)
app.include_router(dashboard_jefe_router)
app.include_router(orders_router)
app.include_router(orders_tasks_router)
app.include_router(reports_router)
app.include_router(catalog_router)
app.include_router(supplies_router)
app.include_router(dashboard_empleado_router)
app.include_router(client_router)
app.include_router(notifications_router)
app.include_router(scrap_router, prefix="/api/v1/scrap", tags=["Scrap / Incidencias"])
app.include_router(bulk_import_router)

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


@app.get(
    "/api/v1/uploads/{file_path:path}",
    tags=["uploads"],
    summary="Servir imagen con CORS",
    include_in_schema=False,
)
async def serve_image(file_path: str):
    """Sirve una imagen desde el directorio de uploads con CORS explícito."""
    file_location = _uploads_path / file_path
    
    # Seguridad: prevenir path traversal
    if not file_location.resolve().is_relative_to(_uploads_path.resolve()):
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    if not file_location.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    return FileResponse(
        path=file_location,
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": "inline",
        }
    )
