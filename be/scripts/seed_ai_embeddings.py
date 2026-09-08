"""
Archivo: be/scripts/seed_ai_embeddings.py
Descripción: Script para indexar catálogo + FAQs en ai_embeddings (RAG Fase 1).

¿Qué?
  - Lee brands, categories, styles, products (si existen) desde BD.
  - Genera fragmentos de texto + embeddings (hash determinístico $0, 768 dims).
  - Inserta en ai_embeddings con metadata {source, brand, category, style, product_id}.
  - Incluye FAQs estáticas sobre RF-001, envíos, tallas, contacto.
  - Idempotente: borra ai_embeddings antes de reindexar.

¿Para qué?
  - Poblar RAG para que POST /api/ai/chat tenga contexto real.
  - Usado por: `uv run python scripts/seed_ai_embeddings.py` y POST /api/v1/ai/embeddings/reindex (jefe).

¿Impacto?
  Fase 1 — sin este seed, ai_embeddings vacía → chatbot sin contexto → deriva a WhatsApp siempre.
  Modificar dim rompe: ai_service.get_embedding, migración 048, config AI_EMBEDDING_DIM.
  Dependencias: database.py (SessionLocal), models/*, services/ai_service.py, config.py
"""

import sys
import os

# Agregar be/ al path para importar app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.ai_embedding import AIEmbedding
from app.services.ai_service import get_embedding


# ──────────────────────────────────────────────────────────────
# FAQs estáticas (RF-001, contacto, tallas, envíos)
# ──────────────────────────────────────────────────────────────

FAQS: list[dict] = [
    {
        "content": (
            "¿Cómo ser cliente mayorista en Calzado J&R? "
            "Regístrate en la landing page con tu correo, nombre, teléfono y NIT. "
            "El jefe valida tu cuenta y te da acceso al catálogo mayorista. "
            "Luego puedes hacer pedidos desde tu dashboard cliente."
        ),
        "metadata": {"source": "faq", "topic": "registro_mayorista", "rf": "RF-001"},
    },
    {
        "content": (
            "¿Qué tallas manejan? "
            "Manejamos tallas desde 35 hasta 44 según el estilo. "
            "Cada producto tiene inventario por talla y color. "
            "Consulta disponibilidad en el catálogo o pregunta al asistente por talla específica."
        ),
        "metadata": {"source": "faq", "topic": "tallas"},
    },
    {
        "content": (
            "¿Hacen envíos a todo Colombia? "
            "Sí, enviamos a Bogotá, Medellín, Cali, Barranquilla y todo el país. "
            "El tiempo de entrega depende del pedido y la producción. "
            "Contacta por WhatsApp 573001234567 para cotizar envío."
        ),
        "metadata": {"source": "faq", "topic": "envios"},
    },
    {
        "content": (
            "¿Cómo contacto a Calzado J&R? "
            "WhatsApp: 573001234567. Email: jyrcalzado@gmail.com. "
            "Horario: lunes a sábado 8am-6pm. "
            "También puedes escribir al asistente aquí para dudas del catálogo."
        ),
        "metadata": {"source": "faq", "topic": "contacto"},
    },
    {
        "content": (
            "¿Qué marcas manejan? "
            "Nike, Adidas, Puma, New Balance y Reebok. "
            "Cada marca tiene múltiples estilos: Air Force One, Superstar, California, 9060, Princesa, etc."
        ),
        "metadata": {"source": "faq", "topic": "marcas"},
    },
    {
        "content": (
            "¿Qué categorías tienen? "
            "Dama, Caballero e Infantil. "
            "Reebok Princesa solo está en Dama e Infantil, no en Caballero."
        ),
        "metadata": {"source": "faq", "topic": "categorias"},
    },
    {
        "content": (
            "¿Cómo hago un pedido mayorista? "
            "Inicia sesión como cliente, ve a Catálogo Mayorista, elige productos por talla y cantidad (mínimo 12 pares por estilo/talla), "
            "y confirma el pedido. El jefe lo revisa y asigna tareas de producción."
        ),
        "metadata": {"source": "faq", "topic": "pedidos"},
    },
    {
        "content": (
            "¿Qué es el catálogo mayorista? "
            "Es el catálogo exclusivo para clientes validados con precios y disponibilidad por talla. "
            "Incluye 65 productos combinando marcas, estilos y categorías."
        ),
        "metadata": {"source": "faq", "topic": "catalogo_mayorista"},
    },
]


def _build_product_fragments(db: Session) -> list[dict]:
    """Genera fragmentos para cada producto (si existen) + fallback brands/styles."""
    fragments: list[dict] = []

    try:
        from app.models.product import Product
        from app.models.brand import Brand
        from app.models.category import Category
        from app.models.style import Style

        # Intentar productos
        products = db.execute(select(Product).where(Product.deleted_at.is_(None))).scalars().all()

        if products:
            for p in products:
                # Resolver nombres relacionados
                brand_name = p.brand.name_brand if hasattr(p, "brand") and p.brand else "Sin marca"
                category_name = (
                    p.category.name_category
                    if hasattr(p, "category") and p.category
                    else "Sin categoría"
                )
                style_name = p.style.name_style if hasattr(p, "style") and p.style else "Sin estilo"
                desc = p.description_product or ""
                color = p.color or "varios colores"
                state = "disponible" if p.state else "no disponible"

                content = (
                    f"Producto: {p.name_product}. "
                    f"Marca: {brand_name}. Estilo: {style_name}. Categoría: {category_name}. "
                    f"Color: {color}. Estado: {state}. "
                    f"Descripción: {desc}. "
                    f"Tallas disponibles según inventario por talla."
                ).strip()

                fragments.append(
                    {
                        "content": content,
                        "metadata": {
                            "source": "product",
                            "product_id": str(p.id),
                            "brand": brand_name,
                            "category": category_name,
                            "style": style_name,
                            "color": color,
                            "state": state,
                        },
                    }
                )
        else:
            # Fallback: indexar brands, categories, styles como fragmentos
            brands = db.execute(select(Brand).where(Brand.deleted_at.is_(None))).scalars().all()
            for b in brands:
                fragments.append(
                    {
                        "content": f"Marca: {b.name_brand}. Descripción: {b.description_brand or 'Calzado de calidad'}.",
                        "metadata": {"source": "brand", "brand": b.name_brand},
                    }
                )

            categories = (
                db.execute(select(Category).where(Category.deleted_at.is_(None))).scalars().all()
            )
            for c in categories:
                fragments.append(
                    {
                        "content": f"Categoría: {c.name_category}. Descripción: {c.description_category or ''}.",
                        "metadata": {"source": "category", "category": c.name_category},
                    }
                )

            styles = db.execute(select(Style).where(Style.deleted_at.is_(None))).scalars().all()
            for s in styles:
                brand_name = s.brand.name_brand if hasattr(s, "brand") and s.brand else "Sin marca"
                fragments.append(
                    {
                        "content": f"Estilo: {s.name_style}. Marca: {brand_name}. Descripción: {s.description_style or ''}.",
                        "metadata": {"source": "style", "style": s.name_style, "brand": brand_name},
                    }
                )

    except Exception as e:
        print(f"⚠️  Error generando fragmentos de productos: {e}")

    return fragments


def seed_embeddings(db: Session | None = None) -> int:
    """
    Indexa catálogo + FAQs en ai_embeddings. Borra previos y reindexa.
    Retorna número de fragmentos indexados.
    Si `db` es None, crea SessionLocal propia.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Limpiar previos
        deleted = db.query(AIEmbedding).delete()
        if deleted:
            print(f"🗑️  Eliminados {deleted} embeddings previos")
        db.commit()

        fragments: list[dict] = []

        # 1. Productos / brands / styles
        product_fragments = _build_product_fragments(db)
        fragments.extend(product_fragments)
        print(f"📦 Fragmentos de catálogo: {len(product_fragments)}")

        # 2. FAQs
        fragments.extend(FAQS)
        print(f"❓ FAQs: {len(FAQS)}")

        # 3. Generar embeddings e insertar
        count = 0
        for frag in fragments:
            content = frag["content"]
            metadata = frag.get("metadata")
            try:
                embedding = get_embedding(content)
            except Exception as e:
                print(f"⚠️  Error embedding para '{content[:50]}...': {e}")
                continue

            emb = AIEmbedding(
                content=content,
                embedding=embedding,  # type: ignore
                extra_metadata=metadata,
            )
            db.add(emb)
            count += 1

        db.commit()
        print(f"✅ Indexados {count} fragmentos en ai_embeddings")
        return count

    except Exception as e:
        print(f"❌ Error en seed_embeddings: {e}")
        db.rollback()
        raise
    finally:
        if close_db:
            db.close()


def main() -> None:
    """Entry point para `python scripts/seed_ai_embeddings.py`."""
    print("🚀 Seed AI embeddings — Calzado J&R (Fase 1)")
    try:
        count = seed_embeddings()
        print(f"🎉 Completado: {count} fragmentos indexados")
    except Exception as e:
        print(f"💥 Falló: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
