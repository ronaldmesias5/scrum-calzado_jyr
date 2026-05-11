"""
Archivo: be/tests/conftest.py
Descripción: Fixtures compartidas para todos los tests del backend.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.database import Base
from app.core.config import settings


@pytest.fixture(scope="session")
def engine():
    """Crea un engine de SQLAlchemy para tests."""
    test_engine = create_engine(
        settings.DATABASE_URL,
        echo=False,
    )
    return test_engine


@pytest.fixture(scope="function")
def db_session(engine) -> Session:
    """Provee una sesión de BD transaccional que hace rollback al final."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
