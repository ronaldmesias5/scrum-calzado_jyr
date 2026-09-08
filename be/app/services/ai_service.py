"""
Archivo: be/app/services/ai_service.py
Descripción: Servicio RAG + LLM agnóstico para asistente IA (Fase 1 + Fase 2).

¿Qué?
  - get_embedding(text): genera vector 768 dims (hash determinístico, $0, sin API).
    Reemplazable por nomic-embed-text/Ollama sin cambiar interfaz.
  - search_similar(db, query, k=5): busca top-k en ai_embeddings por distancia coseno.
  - build_prompt(query, contexts, user_context): arma mensajes para LLM con system_prompt + contexto RAG + contexto por rol.
  - call_llm(messages): llama a Groq/Gemini/Ollama/OpenAI según AI_PROVIDER, con fallback mock.
  - chat(db, message, k, user): orquesta RAG completo → ChatResponse (Fase 2: con user para tools).

¿Para qué?
  - RAG del ChatWidget en LandingPage (Fase 1, público, sin auth) y layouts autenticados (Fase 2, con JWT).
  - Base para Fase 3 (búsqueda semántica).

¿Impacto?
  Fase 1/2 — sin este servicio no hay chatbot. Si falla:
  - POST /api/ai/chat → 500 o alucina sin contexto.
  Modificar get_embedding dim rompe: ai_embeddings.embedding, seed script, migración 048.
  Modificar call_llm rompe: ai_chat.py, tests con mock.
  Dependencias: config.py (AI_*), models/ai_embedding.py, models/user.py, services/ai_tools.py,
               prompts/system_prompt.txt, pgvector, openai, groq, google-generativeai (opcionales)
"""

import hashlib
import logging
import math
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.ai_embedding import AIEmbedding

if TYPE_CHECKING:
    from app.models.user import User

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# System prompt
# ──────────────────────────────────────────────────────────────

_SYSTEM_PROMPT_PATH = Path(__file__).parent / "prompts" / "system_prompt.txt"
_SYSTEM_PROMPT_CACHE: str | None = None


def _load_system_prompt() -> str:
    """Carga system_prompt.txt con cache."""
    global _SYSTEM_PROMPT_CACHE
    if _SYSTEM_PROMPT_CACHE is not None:
        return _SYSTEM_PROMPT_CACHE
    try:
        _SYSTEM_PROMPT_CACHE = _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        _SYSTEM_PROMPT_CACHE = (
            "Eres asistente de Calzado J&R, experto en calzado mayorista colombiano. "
            "Responde solo con info del catálogo proporcionado. Si no sabes, deriva a WhatsApp 573001234567."
        )
    return _SYSTEM_PROMPT_CACHE


# ──────────────────────────────────────────────────────────────
# Embeddings — hash determinístico $0 (reemplazable por nomic-embed-text)
# ──────────────────────────────────────────────────────────────


def _hash_embedding(text_content: str, dim: int = 768) -> list[float]:
    """
    Genera embedding determinístico de `dim` dims a partir de hash SHA256.
    Normalizado a norma L2 = 1 para distancia coseno.
    Es $0, sin API, y permite que RAG funcione sin modelo local.
    Para producción semántica real, reemplazar por nomic-embed-text vía Ollama.
    """
    # Tokenizar simple: palabras en minúsculas
    tokens = re.findall(r"\w+", text_content.lower())
    if not tokens:
        tokens = [text_content.lower()]

    vec = [0.0] * dim
    for token in tokens:
        # Hash por token → índice y valor
        h = hashlib.sha256(token.encode()).digest()
        # Usar 4 bytes por posición para distribuir
        for i in range(0, len(h) - 1, 2):
            idx = (h[i] * 256 + h[i + 1]) % dim
            # Valor pseudo-aleatorio entre -1 y 1 basado en hash
            val = ((h[i] % 100) / 50.0) - 1.0
            vec[idx] += val

    # Normalizar L2
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


def get_embedding(text_content: str, dim: int | None = None) -> list[float]:
    """
    Genera embedding para `text_content`. Intenta modelo real si disponible, fallback a hash.
    `dim` por defecto es settings.AI_EMBEDDING_DIM (768).
    """
    target_dim = dim or settings.AI_EMBEDDING_DIM
    # Intentar modelo local si está instalado (sentence-transformers)
    # Por ahora, hash determinístico es suficiente para Fase 1 MVP
    # TODO Fase 3: integrar nomic-embed-text vía Ollama si AI_EMBEDDING_MODEL != hash
    try:
        # Si en el futuro se instala sentence-transformers, se usaría aquí
        # from sentence_transformers import SentenceTransformer
        # model = SentenceTransformer(settings.AI_EMBEDDING_MODEL)
        # return model.encode(text).tolist()
        pass
    except Exception as e:  # pragma: no cover
        logger.warning(f"[ai] embedding model falló, usando hash: {e}")

    return _hash_embedding(text_content, dim=target_dim)


# ──────────────────────────────────────────────────────────────
# Búsqueda RAG
# ──────────────────────────────────────────────────────────────


def search_similar(db: Session, query: str, k: int = 5) -> list[tuple[AIEmbedding, float]]:
    """
    Busca top-k fragmentos más similares a `query` en ai_embeddings.
    Retorna lista de (AIEmbedding, score) donde score es distancia coseno (0=igual, 2=opuesto).
    Si pgvector no disponible o tabla vacía, fallback a ILIKE.
    """
    if not query.strip():
        return []

    # Verificar si hay datos
    try:
        count = db.query(AIEmbedding).count()
        if count == 0:
            return []
    except Exception as e:
        logger.warning(f"[ai] count ai_embeddings falló: {e}")
        return []

    query_embedding = get_embedding(query)

    # Intentar búsqueda vectorial con pgvector
    try:
        # Usar operador <=> (cosine distance) vía SQLAlchemy
        # AIEmbedding.embedding.cosine_distance(query_embedding) si pgvector está activo
        # Fallback a text() si Vector es Text (sin pgvector)
        from pgvector.sqlalchemy import Vector  # type: ignore

        # Verificar que la columna es Vector y no Text fallback
        col_type = AIEmbedding.__table__.c.embedding.type  # type: ignore
        if isinstance(col_type, Vector):
            # Búsqueda con pgvector
            stmt = (
                select(
                    AIEmbedding,
                    AIEmbedding.embedding.cosine_distance(query_embedding).label("distance"),
                )  # type: ignore
                .order_by(AIEmbedding.embedding.cosine_distance(query_embedding))  # type: ignore
                .limit(k)
            )
            results = db.execute(stmt).all()
            # results es list[tuple[AIEmbedding, distance]]
            return [(row[0], float(row[1])) for row in results]  # type: ignore
    except ImportError:
        pass
    except Exception as e:
        logger.warning(f"[ai] búsqueda vectorial falló, fallback a ILIKE: {e}")

    # Fallback: búsqueda por texto (ILIKE)
    try:
        like_pattern = f"%{query.strip()}%"
        stmt = select(AIEmbedding).where(AIEmbedding.content.ilike(like_pattern)).limit(k)  # type: ignore
        rows = db.execute(stmt).scalars().all()
        return [(r, 0.5) for r in rows]
    except Exception as e:
        logger.warning(f"[ai] fallback ILIKE falló: {e}")
        return []


# ──────────────────────────────────────────────────────────────
# Prompt building
# ──────────────────────────────────────────────────────────────


def build_prompt(
    query: str,
    contexts: list[tuple[AIEmbedding, float]],
    user_context: str | None = None,
) -> list[dict[str, str]]:
    """
    Arma mensajes para LLM: system + contexto RAG + contexto por rol + user query.
    Fase 2: user_context viene de ai_tools.format_tool_context (con JWT).
    """
    system = _load_system_prompt()

    if contexts:
        context_text = "\n\n".join(
            f"[Fuente {i + 1}] {emb.content} (metadata: {emb.extra_metadata})"
            for i, (emb, _score) in enumerate(contexts)
        )
        system += f"\n\nContexto del catálogo y FAQs (usa solo esto):\n{context_text}"

    if user_context:
        system += f"\n\nContexto del usuario y datos relevantes:\n{user_context}"

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": query},
    ]


# ──────────────────────────────────────────────────────────────
# LLM agnóstico
# ──────────────────────────────────────────────────────────────


def _call_groq(messages: list[dict[str, str]]) -> str:
    """Llama a Groq vía OpenAI SDK."""
    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(
            api_key=settings.AI_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        resp = client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=messages,  # type: ignore
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=0.7,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"[ai] Groq falló: {e}")
        raise


def _call_gemini(messages: list[dict[str, str]]) -> str:
    """Llama a Gemini vía google-generativeai."""
    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=settings.AI_API_KEY)
        model = genai.GenerativeModel(settings.AI_MODEL)
        # Convertir messages a prompt Gemini
        prompt = "\n\n".join(f"{m['role']}: {m['content']}" for m in messages)
        resp = model.generate_content(prompt)
        return resp.text or ""
    except Exception as e:
        logger.error(f"[ai] Gemini falló: {e}")
        raise


def _call_ollama(messages: list[dict[str, str]]) -> str:
    """Llama a Ollama local vía OpenAI SDK."""
    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(
            api_key="ollama",
            base_url="http://localhost:11434/v1",
        )
        resp = client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=messages,  # type: ignore
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=0.7,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"[ai] Ollama falló: {e}")
        raise


def _call_openai(messages: list[dict[str, str]]) -> str:
    """Llama a OpenAI."""
    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=settings.AI_API_KEY)
        resp = client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=messages,  # type: ignore
            max_tokens=settings.AI_MAX_TOKENS,
            temperature=0.7,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"[ai] OpenAI falló: {e}")
        raise


def _mock_response(query: str, contexts: list[tuple[AIEmbedding, float]]) -> str:
    """Respuesta mock cuando AI_API_KEY vacío o provider disabled (para tests/dev sin key)."""
    if not contexts:
        return (
            "Gracias por tu consulta. Por el momento no tengo información específica sobre eso en el catálogo. "
            "Te invito a contactarnos por WhatsApp al 573001234567 para atención personalizada."
        )
    # Respuesta basada en contexto recuperado
    top_content = contexts[0][0].content[:300]
    return (
        f"Basado en nuestro catálogo: {top_content}... "
        f"Si necesitas más detalles, contáctanos por WhatsApp al 573001234567."
    )


def call_llm(
    messages: list[dict[str, str]], contexts: list[tuple[AIEmbedding, float]] | None = None
) -> str:
    """
    Llama al LLM según AI_PROVIDER. Si no hay API key o provider disabled, usa mock.
    """
    if not settings.AI_API_KEY or settings.AI_PROVIDER == "disabled":
        query = messages[-1]["content"] if messages else ""
        return _mock_response(query, contexts or [])

    provider = settings.AI_PROVIDER.lower()
    try:
        if provider == "groq":
            return _call_groq(messages)
        elif provider == "gemini":
            return _call_gemini(messages)
        elif provider == "ollama":
            return _call_ollama(messages)
        elif provider == "openai":
            return _call_openai(messages)
        else:
            logger.warning(f"[ai] provider desconocido {provider}, usando mock")
            query = messages[-1]["content"] if messages else ""
            return _mock_response(query, contexts or [])
    except Exception as e:
        logger.error(f"[ai] LLM {provider} falló, fallback a mock: {e}")
        query = messages[-1]["content"] if messages else ""
        return _mock_response(query, contexts or [])


# ──────────────────────────────────────────────────────────────
# Orquestación RAG completa
# ──────────────────────────────────────────────────────────────


def chat(
    db: Session,
    message: str,
    k: int = 5,
    user: "User | None" = None,
) -> dict[str, Any]:
    """
    Orquesta RAG completo: search → build_prompt (con user_context) → call_llm → respuesta.
    Fase 2: si `user` viene (JWT válido), añade contexto por rol vía ai_tools.format_tool_context.
    Retorna dict con answer, sources, suggested_products.
    """
    contexts = search_similar(db, message, k=k)

    # Fase 2: contexto por rol (pedidos/tareas/productos) si hay usuario autenticado
    user_context: str | None = None
    if user is not None:
        try:
            from app.services.ai_tools import format_tool_context

            user_context = format_tool_context(user, db, message)
        except Exception as e:
            logger.warning(f"[ai] format_tool_context falló: {e}")

    messages = build_prompt(message, contexts, user_context=user_context)
    answer = call_llm(messages, contexts)

    sources = [
        {
            "content": emb.content,
            "metadata": emb.extra_metadata,
            "score": float(score),
        }
        for emb, score in contexts
    ]

    # Productos sugeridos: filtrar metadata source == product
    suggested = []
    for emb, _score in contexts:
        meta = emb.extra_metadata or {}
        if meta.get("source") == "product":
            suggested.append(
                {
                    "content": emb.content[:200],
                    "metadata": meta,
                }
            )

    return {
        "answer": answer,
        "sources": sources,
        "suggested_products": suggested[:3],
    }


def get_embeddings_count(db: Session) -> int:
    """Retorna número de fragmentos indexados."""
    try:
        return db.query(AIEmbedding).count()
    except Exception:
        return 0


def is_ai_enabled() -> bool:
    """True si AI_API_KEY configurada y provider no es disabled."""
    return bool(settings.AI_API_KEY) and settings.AI_PROVIDER != "disabled"
