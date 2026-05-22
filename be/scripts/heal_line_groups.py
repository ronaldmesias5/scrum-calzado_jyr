"""
Script: heal_line_groups.py
Descripción: Cura los line_group en order_details para datos existentes.
Asigna line_group basado en patrones de amount usando DENSE_RANK().

Ejecutar:
    python scripts/heal_line_groups.py
    # o desde Docker:
    docker exec calzado_jyr_be python3 scripts/heal_line_groups.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings
from app.core.database import SessionLocal
from sqlalchemy import text


def heal_line_groups():
    """Asigna line_group a order_details donde sea 0 usando DENSE_RANK()."""
    db = SessionLocal()
    try:
        result = db.execute(text("""
            UPDATE order_details
            SET line_group = sub.line_group
            FROM (
                SELECT id,
                       DENSE_RANK() OVER (
                           PARTITION BY order_id, product_id 
                           ORDER BY amount
                       ) as line_group
                FROM order_details
                WHERE line_group = 0
            ) sub
            WHERE order_details.id = sub.id
        """))
        db.commit()
        print(f"✅ line_group curado: {result.rowcount} filas actualizadas")
    except Exception as e:
        print(f"❌ Error curando line_group: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🔧 Curando line_group en order_details...")
    heal_line_groups()
    print("✨ Hecho.")
