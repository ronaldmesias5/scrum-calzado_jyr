"""
Archivo: be/app/routers/ai_chat.py
Descripción: Router FastAPI para asistente IA (Fase 1 RAG + Fase 2 contexto por rol + Fase 3 avanzado).

¿Qué?
  - POST /api/v1/ai/chat (público, rate limit 10/min por IP, validación 500 chars, anti injection, JWT opcional para contexto por rol)
  - GET  /api/v1/ai/health (público, estado del servicio)
  - POST /api/v1/ai/embeddings/reindex (solo jefe/admin, reindexa catálogo + FAQs)
  - GET  /api/v1/ai/search/semantic (público, búsqueda semántica, Fase 3)
  - GET  /api/v1/ai/recommend (público, recomendador, Fase 3)
  - POST /api/v1/ai/generate-description (solo jefe, generador, Fase 3)
  - POST /api/v1/ai/classify-incidence (autenticado, clasificador, Fase 3)

¿Para qué?
  - ChatWidget en LandingPage (Fase 1) y layouts autenticados (Fase 2, con JWT).
  - Búsqueda semántica, recomendador, generador y clasificador (Fase 3).
  - Health para monitoreo y CI, reindex para jefe.

¿Impacto?
  Fase 1/2/3 — sin este router no hay chatbot ni búsqueda. Si falla:
  - ChatWidget → 404 o 500, búsqueda semántica → 404.
  Modificar prefix rompe: aiApi.ts, useChat.ts, tests.
  Dependencias: schemas/ai.py, services/ai_service.py, services/ai_tools.py, dependencies.py, config.py
"""

import time
from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.logging_config import ai_logger
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse, HealthResponse, ReindexResponse, SourceItem
from app.services import ai_service
from app.utils.security import decode_token

router = APIRouter(
    prefix="/api/v1/ai",
    tags=["ai"],
)

# ──────────────────────────────────────────────────────────────
# Rate limiting en memoria para /chat (10 req/min por IP)
# Nota: RateLimitMiddleware global está deshabilitado en development,
#       por eso este rate limit es explícito y siempre activo.
# ──────────────────────────────────────────────────────────────

_RATE_LIMIT_MAX = 10
_RATE_LIMIT_WINDOW = 60  # segundos
_rate_store: dict[str, list[float]] = defaultdict(list)


def _check_rate_limit(request: Request) -> None:
    """Verifica rate limit 10/min por IP, lanza 429 si excede."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    # Limpiar timestamps fuera de ventana
    _rate_store[client_ip] = [ts for ts in _rate_store[client_ip] if now - ts < _RATE_LIMIT_WINDOW]
    if len(_rate_store[client_ip]) >= _RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas solicitudes. Intenta de nuevo en un minuto.",
        )
    _rate_store[client_ip].append(now)


def _clear_rate_limit_for_tests() -> None:
    """Solo para tests: limpia el store."""
    _rate_store.clear()


# ──────────────────────────────────────────────────────────────
# JWT opcional para Fase 2 (no rompe Fase 1 público)
# ──────────────────────────────────────────────────────────────

_optional_bearer = HTTPBearer(auto_error=False)


def _get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_optional_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    """Extrae usuario si hay JWT válido, None si no hay token o es inválido (no lanza 401)."""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if not payload or payload.get("type") != "access":
            return None
        email: str | None = payload.get("sub")
        if not email:
            return None
        stmt = select(User).where(User.email == email)
        user = db.execute(stmt).scalar_one_or_none()
        if not user or not user.is_active:
            return None
        token_version = payload.get("version")
        if token_version is not None and token_version != user.session_version:
            return None
        return user
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────
# POST /chat — público (Fase 1) + JWT opcional (Fase 2)
# ──────────────────────────────────────────────────────────────


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat con asistente IA (RAG)",
    description="Público. Valida 500 chars, anti prompt-injection, rate limit 10/min por IP. Si envías JWT, añade contexto por rol (pedidos/tareas).",
)
def chat(
    body: ChatRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User | None, Depends(_get_optional_user)] = None,
) -> ChatResponse:
    """Chat RAG: busca contexto en ai_embeddings y llama a LLM (con contexto por rol si hay JWT)."""
    _check_rate_limit(request)

    # Fase 4: log estructurado
    try:
        ai_logger.info(
            "ai_chat request | ip=%s | user=%s | msg_len=%d",
            request.client.host if request.client else "unknown",
            str(current_user.id) if current_user else "anon",
            len(body.message),
        )
    except Exception:
        pass

    try:
        result = ai_service.chat(db, body.message, k=5, user=current_user)
    except Exception as e:
        ai_logger.error("ai_chat error | %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error del asistente: {str(e)}",
        ) from e

    sources = [
        SourceItem(
            content=s["content"],
            metadata=s.get("metadata"),
            score=s.get("score"),
        )
        for s in result.get("sources", [])
    ]

    return ChatResponse(
        answer=result.get("answer", ""),
        sources=sources,
        suggested_products=result.get("suggested_products", []),
    )


# ──────────────────────────────────────────────────────────────
# GET /health — público
# ──────────────────────────────────────────────────────────────


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Estado del servicio IA",
)
def health(
    db: Annotated[Session, Depends(get_db)],
) -> HealthResponse:
    """Retorna estado del servicio IA (provider, modelo, embeddings count)."""
    count = ai_service.get_embeddings_count(db)
    return HealthResponse(
        status="ok",
        provider=settings.AI_PROVIDER,
        model=settings.AI_MODEL,
        embeddings_count=count,
        ai_enabled=ai_service.is_ai_enabled(),
    )


# ──────────────────────────────────────────────────────────────
# POST /embeddings/reindex — solo jefe/admin
# ──────────────────────────────────────────────────────────────


@router.post(
    "/embeddings/reindex",
    response_model=ReindexResponse,
    summary="Reindexar embeddings (solo jefe/admin)",
)
def reindex_embeddings(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ReindexResponse:
    """Reindexa catálogo + FAQs en ai_embeddings. Solo jefe o admin."""
    from app.dependencies import _require_admin_or_jefe

    try:
        _require_admin_or_jefe(current_user)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de jefe o administrador",
        )

    try:
        # Importar aquí para evitar ciclo
        from scripts.seed_ai_embeddings import seed_embeddings

        count = seed_embeddings(db)
        return ReindexResponse(
            status="ok",
            indexed=count,
            message=f"Reindexado completado: {count} fragmentos",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en reindex: {str(e)}",
        ) from e


# ──────────────────────────────────────────────────────────────
# Fase 3 — Búsqueda semántica, recomendador, generador, clasificador
# ──────────────────────────────────────────────────────────────


@router.get(
    "/search/semantic",
    summary="Búsqueda semántica en catálogo (RAG)",
    description="Público. Busca en ai_embeddings por similitud. Query 2-200 chars.",
)
def semantic_search(
    q: str,
    db: Annotated[Session, Depends(get_db)],
    k: int = 10,
) -> dict:
    """Búsqueda semántica: query → top-k fragmentos similares."""
    from app.schemas.ai import SemanticSearchResponse, SourceItem as AISourceItem

    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=422, detail="Query debe tener al menos 2 caracteres")
    if len(q) > 200:
        raise HTTPException(status_code=422, detail="Query no puede exceder 200 caracteres")
    if k < 1 or k > 20:
        raise HTTPException(status_code=422, detail="k debe estar entre 1 y 20")

    results = ai_service.semantic_search(db, q.strip(), k=k)
    items = [
        AISourceItem(content=emb.content, metadata=emb.extra_metadata, score=float(score))
        for emb, score in results
    ]
    return SemanticSearchResponse(query=q.strip(), results=items, total=len(items)).model_dump()


@router.get(
    "/recommend",
    summary="Recomendar productos similares",
    description="Público. Recomienda productos similares a product_id (solo productos activos).",
)
def recommend(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
    k: int = 5,
) -> dict:
    """Recomienda productos similares a product_id."""
    from app.schemas.ai import RecommendResponse, SourceItem as AISourceItem

    if k < 1 or k > 10:
        raise HTTPException(status_code=422, detail="k debe estar entre 1 y 10")

    # Validar UUID
    import uuid as _uuid

    try:
        _uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="product_id debe ser un UUID válido")

    results = ai_service.recommend_similar(db, product_id, k=k)
    items = [
        AISourceItem(content=emb.content, metadata=emb.extra_metadata, score=float(score))
        for emb, score in results
    ]
    return RecommendResponse(
        product_id=product_id, recommendations=items, total=len(items)
    ).model_dump()


@router.post(
    "/generate-description",
    summary="Generar descripción de producto con IA (solo jefe)",
    description="Solo jefe/admin. Genera descripción vía LLM con tono y longitud configurables.",
)
def generate_description(
    body: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Genera descripción para producto vía LLM."""
    from app.dependencies import _require_admin_or_jefe
    from app.schemas.ai import GenerateDescriptionRequest, GenerateDescriptionResponse

    try:
        _require_admin_or_jefe(current_user)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de jefe o administrador",
        )

    # Validar con schema
    try:
        req = GenerateDescriptionRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        desc = ai_service.generate_product_description(
            db, req.product_id, tone=req.tone or "profesional", max_length=req.max_length or 200
        )
        return GenerateDescriptionResponse(
            product_id=req.product_id, generated_description=desc, model=settings.AI_MODEL
        ).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando descripción: {str(e)}")


@router.post(
    "/classify-incidence",
    summary="Clasificar incidencia con IA",
    description="Autenticado. Clasifica texto de incidencia en categoría y sugiere código de defecto.",
)
def classify_incidence(
    body: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Clasifica incidencia vía LLM o reglas."""
    from app.schemas.ai import ClassifyIncidenceRequest, ClassifyIncidenceResponse

    # Validar con schema
    try:
        req = ClassifyIncidenceRequest(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        result = ai_service.classify_incidence(req.text)
        return ClassifyIncidenceResponse(**result).model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clasificando incidencia: {str(e)}")
