"""
Archivo: be/app/schemas/ai.py
Descripción: Schemas Pydantic para el asistente IA (Fase 1, RAG).

¿Qué?
  Define ChatRequest (validación 500 chars, anti prompt-injection),
  ChatResponse (answer + sources + suggested_products), HealthResponse,
  ReindexResponse. Usados por routers/ai_chat.py.

¿Para qué?
  - Validar entrada del usuario antes de RAG/LLM (seguridad, costo).
  - Tipar respuesta para frontend (ChatWidget) y OpenAPI docs.
  - Documentar API en /docs.

¿Impacto?
  Fase 1 — sin estos schemas no hay validación. Si falla:
  - Mensajes >500 chars llegarían al LLM → costo y DoS.
  - Prompt injection no bloqueado → jailbreak.
  Modificar ChatRequest rompe: ai_chat.py, aiApi.ts, useChat.ts.
  Dependencias: routers/ai_chat.py, services/ai_service.py
"""

import re
from pydantic import BaseModel, ConfigDict, Field, field_validator

# Patrones de prompt injection (case-insensitive)
_INJECTION_PATTERNS = [
    r"ignore\s+previous\s+instructions",
    r"ignore\s+all\s+previous",
    r"system\s*:",
    r"jailbreak",
    r"\bDAN\b",
    r"do\s+anything\s+now",
    r"reveal\s+your\s+prompt",
    r"reveal\s+system\s+prompt",
    r"act\s+as\s+if\s+you\s+are",
    r"pretend\s+you\s+are",
]


class ChatRequest(BaseModel):
    """Request para POST /api/ai/chat (público, Fase 1)."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Mensaje del usuario (1-500 caracteres)",
        examples=["¿Tienen botas talla 42 antideslizantes?"],
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Valida contenido y bloquea prompt injection."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("El mensaje no puede estar vacío")
        if len(stripped) > 500:
            raise ValueError("El mensaje no puede exceder 500 caracteres")
        lowered = stripped.lower()
        for pattern in _INJECTION_PATTERNS:
            if re.search(pattern, lowered, re.IGNORECASE):
                raise ValueError("Mensaje no permitido por políticas de seguridad")
        return stripped


class SourceItem(BaseModel):
    """Fuente RAG usada para generar la respuesta."""

    content: str = Field(..., description="Fragmento de texto recuperado")
    metadata: dict | None = Field(default=None, description="Metadata (source, product_id, etc.)")
    score: float | None = Field(default=None, description="Score de similitud (0-1)")

    model_config = ConfigDict(from_attributes=True)


class ChatResponse(BaseModel):
    """Response para POST /api/ai/chat."""

    answer: str = Field(..., description="Respuesta del asistente")
    sources: list[SourceItem] = Field(default_factory=list, description="Fuentes RAG (top-k)")
    suggested_products: list[dict] = Field(
        default_factory=list, description="Productos sugeridos (si aplica)"
    )

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    """Response para GET /api/ai/health."""

    status: str = Field(..., examples=["ok"])
    provider: str = Field(..., examples=["groq"])
    model: str = Field(..., examples=["openai/gpt-oss-20b"])
    embeddings_count: int = Field(..., description="Número de fragmentos indexados")
    ai_enabled: bool = Field(..., description="True si AI_API_KEY configurada")


class ReindexResponse(BaseModel):
    """Response para POST /api/ai/embeddings/reindex (solo jefe)."""

    status: str = Field(..., examples=["ok"])
    indexed: int = Field(..., description="Número de fragmentos reindexados")
    message: str = Field(..., examples=["Reindexado completado"])


# ──────────────────────────────────────────────────────────────
# Fase 3 — Búsqueda semántica, recomendador, generador, clasificador
# ──────────────────────────────────────────────────────────────


class SemanticSearchResponse(BaseModel):
    """Response para GET /api/v1/ai/search/semantic."""

    query: str = Field(..., description="Query original")
    results: list[SourceItem] = Field(..., description="Top-k fragmentos similares")
    total: int = Field(..., description="Número de resultados")

    model_config = ConfigDict(from_attributes=True)


class RecommendResponse(BaseModel):
    """Response para GET /api/v1/ai/recommend."""

    product_id: str = Field(..., description="Producto base")
    recommendations: list[SourceItem] = Field(..., description="Productos similares")
    total: int = Field(..., description="Número de recomendaciones")

    model_config = ConfigDict(from_attributes=True)


class GenerateDescriptionRequest(BaseModel):
    """Request para POST /api/v1/ai/generate-description (solo jefe)."""

    product_id: str = Field(..., description="ID del producto (UUID)")
    tone: str | None = Field(
        default="profesional",
        description="Tono: profesional | casual | tecnico | vendedor",
        examples=["profesional"],
    )
    max_length: int | None = Field(default=200, ge=50, le=500, description="Máx caracteres")

    @field_validator("product_id")
    @classmethod
    def validate_product_id(cls, v: str) -> str:
        import uuid as _uuid

        try:
            _uuid.UUID(v)
        except ValueError:
            raise ValueError("product_id debe ser un UUID válido")
        return v

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"profesional", "casual", "tecnico", "vendedor"}
        if v not in allowed:
            raise ValueError(f"Tono inválido. Permitidos: {', '.join(sorted(allowed))}")
        return v


class GenerateDescriptionResponse(BaseModel):
    """Response para POST /api/v1/ai/generate-description."""

    product_id: str = Field(..., description="ID del producto")
    generated_description: str = Field(..., description="Descripción generada por IA")
    model: str = Field(..., description="Modelo usado")

    model_config = ConfigDict(from_attributes=True)


class ClassifyIncidenceRequest(BaseModel):
    """Request para POST /api/v1/ai/classify-incidence."""

    text: str = Field(
        ..., min_length=10, max_length=1000, description="Texto de la incidencia (10-1000 chars)"
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 10:
            raise ValueError("El texto debe tener al menos 10 caracteres")
        if len(stripped) > 1000:
            raise ValueError("El texto no puede exceder 1000 caracteres")
        return stripped


class ClassifyIncidenceResponse(BaseModel):
    """Response para POST /api/v1/ai/classify-incidence."""

    category: str = Field(
        ..., description="Categoría: falla | faltante | perdida | en_reparacion | devuelto | otro"
    )
    confidence: float = Field(..., ge=0, le=1, description="Confianza 0-1")
    suggested_defect_code: str | None = Field(
        default=None, description="Código de defecto sugerido"
    )
    reasoning: str = Field(..., description="Explicación breve")

    model_config = ConfigDict(from_attributes=True)
