"""
Módulo: app/init_db.py (Simplificado)
Descripción: Inicialización automática de datos iniciales en el startup.
¿Para qué? Garantizar que roles y tipos de documentos estén en la BD.
¿Impacto? Se ejecuta automáticamente en el startup del backend.
"""

import logging
from sqlalchemy.orm import Session
from app.init.seed_data import seed_all

logger = logging.getLogger(__name__)


def initialize_database(db: Session) -> None:
    """Inicializa los datos base de la BD automáticamente."""
    try:
        logger.info("📦 Cargando datos iniciales...")
        seed_all(db)
        logger.info("✨ Datos iniciales listos")
    except Exception as e:
        logger.error(f"Error: {str(e)}")

