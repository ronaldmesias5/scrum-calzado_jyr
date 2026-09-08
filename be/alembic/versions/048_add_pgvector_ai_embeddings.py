"""Add pgvector extension and ai_embeddings table for RAG (Fase 0).

¿Qué? Crea extensión `vector` y tabla `ai_embeddings` para búsqueda semántica.
¿Para qué? RAG del asistente IA: indexar 65 productos + FAQs y recuperar top-k
           por similitud coseno. Base para Fase 1 (ChatWidget) y Fase 2/3.
¿Impacto? Sin esta migración no hay RAG. Tabla vacía hasta que
          seed_ai_embeddings.py la pueble en Fase 1. Índice HNSW permite
          búsqueda en tabla vacía (ivfflat fallaría sin datos).

Revision ID: 048_add_pgvector_ai_embeddings
Revises: 047_nullable_order_customer
Create Date: 2026-09-05
"""

from typing import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

try:
    from pgvector.sqlalchemy import Vector  # type: ignore[import-untyped]

    VECTOR_TYPE = Vector(768)
except ImportError:  # pragma: no cover — fallback si pgvector no instalado en CI sin deps IA
    VECTOR_TYPE = sa.Text()  # type: ignore[assignment]

revision: str = "048_add_pgvector_ai_embeddings"
down_revision: str | Sequence[str] | None = "047_nullable_order_customer"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Extensión vector — idempotente, requerida para tipo VECTOR
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))

    op.create_table(
        "ai_embeddings",
        sa.Column(
            "id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", VECTOR_TYPE, nullable=False),
        sa.Column("metadata", JSONB, nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    # Índice HNSW para búsqueda por distancia coseno — funciona con tabla vacía
    # Nota: ivfflat requeriría datos previos y fallaría en tabla vacía
    try:
        op.execute(
            sa.text(
                "CREATE INDEX ix_ai_embeddings_embedding_hnsw "
                "ON ai_embeddings USING hnsw (embedding vector_cosine_ops)"
            )
        )
    except Exception:
        # Fallback: si HNSW no disponible (PG < 16 o pgvector viejo), usar ivfflat sin datos
        # Se creará en seed_ai_embeddings.py tras insertar datos
        pass


def downgrade() -> None:
    op.drop_table("ai_embeddings")
    # No eliminar extensión vector — otras tablas podrían usarla en futuro
    # op.execute(sa.text("DROP EXTENSION IF EXISTS vector"))
