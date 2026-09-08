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
