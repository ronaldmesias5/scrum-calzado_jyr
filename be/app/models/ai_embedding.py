# ════════════════════════════════════════
# 📄 Modelo ORM SQLAlchemy para la tabla `ai_embeddings` (RAG del asistente IA)
# ════════════════════════════════════════

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

try:
    from pgvector.sqlalchemy import Vector  # type: ignore[import-untyped]
except (
    ImportError
):  # pragma: no cover — permite importar sin pgvector instalado (tests/CI sin deps IA)
    Vector = Text  # fallback para que Alembic no rompa si pgvector aún no está instalado

if TYPE_CHECKING:
    pass


class AIEmbedding(Base):
    """Modelo ORM para la tabla `ai_embeddings` (fragmentos vectorizados para RAG)."""

    __tablename__ = "ai_embeddings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Vector 768 dims — nomic-embed-text (local, $0). Si cambias modelo, migra dim.
    embedding: Mapped[list[float]] = mapped_column(
        Vector(768),  # type: ignore[arg-type]
        nullable=False,
    )

    # Metadata libre: {source: "product"|"faq"|"doc", product_id, style, brand, ...}
    extra_metadata: Mapped[dict | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
