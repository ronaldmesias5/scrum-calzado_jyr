"""
Archivo: app/database.py
Descripción: Configuración centralizada de la conexión a PostgreSQL con SQLAlchemy 2.0 ORM.

¿Qué?
  Crea y configura:
  - `engine`: Conexión a la BD con pool de conexiones reutilizables
  - `SessionLocal`: Factory para crear sesiones de BD (una por request HTTP)
  - `Base`: Clase padre que heredan todos los modelos ORM

¿Para qué?
  Centralizar la configuración de la BD en un único lugar.
  Evitar duplicación de código de conexión en cada módulo.
  
¿Impacto?
  Crítico. Sin este módulo:
  - No hay conexión a PostgreSQL
  - Los modelos ORM no sabrían dónde guardar/leer datos
  - Toda la aplicación se detendría
  
  Cualquier cambio aquí (pool_size, echo, etc.) afecta al RENDIMIENTO
  de consultas y visualización de errores SQL.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Clase base para todos los modelos ORM del proyecto."""
    pass
