"""
Archivo: be/tests/conftest.py
Descripción: Fixtures compartidas para todos los tests del backend.

Aislamiento: los tests usan una base de datos dedicada (`<bd_dev>_test`),
nunca la base de datos de desarrollo. El esquema se genera con las mismas
migraciones Alembic y los mismos datos semilla, y cada test corre dentro de
una transacción que se revierte al final (patrón savepoint, permite que los
endpoints hagan commit sin persistir nada).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.config import settings
from app.init_db import run_migrations


def _test_db_url() -> str:
    """URL de la BD de tests: misma instancia Postgres, nombre `<bd>_test`.

    Nota: se construye con manipulación de string (no con `str(make_url(...))`)
    porque el re-renderizado de la URL percent-encodea la contraseña y rompe la autenticación.
    """
    db_name = make_url(settings.DATABASE_URL).database
    base = settings.DATABASE_URL.rsplit("/", 1)[0]
    return f"{base}/{db_name}_test"


TEST_DATABASE_URL = _test_db_url()


def _ensure_test_database_exists() -> None:
    """Crea la BD de tests si no existe (usa la BD de dev solo para el CREATE DATABASE)."""
    try:
        engine = create_engine(TEST_DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine.dispose()
    except OperationalError:
        admin_engine = create_engine(settings.DATABASE_URL, isolation_level="AUTOCOMMIT")
        db_name = make_url(TEST_DATABASE_URL).database
        with admin_engine.connect() as conn:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
        admin_engine.dispose()


def _reset_schema() -> None:
    """Limpia el esquema público para arrancar cada sesión de tests desde cero.

    Recrea también las extensiones que en desarrollo instala `db/init/init.sql`
    (uuid-ossp, pg_trgm), porque `DROP SCHEMA public CASCADE` elimina sus objetos
    y las migraciones Alembic asumen que `uuid_generate_v4()` existe.
    """
    engine = create_engine(TEST_DATABASE_URL, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text('DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE'))
        conn.execute(text('CREATE EXTENSION "uuid-ossp"'))
        conn.execute(text("DROP EXTENSION IF EXISTS pg_trgm CASCADE"))
        conn.execute(text("CREATE EXTENSION pg_trgm"))
    engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def test_database():
    """Setup de sesión: BD de tests con migraciones Alembic + datos semilla."""
    _ensure_test_database_exists()
    _reset_schema()

    assert run_migrations(TEST_DATABASE_URL, raise_on_error=True), "Las migraciones Alembic fallaron en la BD de tests"

    from app.init.seed_data import seed_all

    engine = create_engine(TEST_DATABASE_URL)
    session = Session(bind=engine)
    seed_all(session)
    session.close()
    engine.dispose()

    yield


@pytest.fixture(scope="session")
def engine(test_database):
    """Engine de SQLAlchemy contra la BD de tests."""
    test_engine = create_engine(TEST_DATABASE_URL, echo=False)
    yield test_engine
    test_engine.dispose()


@pytest.fixture()
def db_session(engine) -> Session:
    """Sesión transaccional: todo lo escrito se revierte al terminar el test.

    `join_transaction_mode="create_savepoint"` permite que el código de la app
    haga `commit()` (se convierte en savepoint) sin cerrar la transacción externa.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient con `get_db` sobreescrito para usar la sesión transaccional.

    Nota: NO se usa `with TestClient(app)` para no ejecutar el lifespan
    (el lifespan corre migraciones contra la BD de desarrollo).
    """
    from app.dependencies import get_db
    from app.main import app

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def jefe_headers(client) -> dict[str, str]:
    """Headers de autenticación del usuario jefe sembrado por los seeds."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ronald.jefe@gmail.com", "password": "Test123456!"},
    )
    assert response.status_code == 200, response.text
    csrf = client.cookies.get("csrf_token") or response.cookies.get("csrf_token")
    headers: dict[str, str] = {"Authorization": f"Bearer {response.json()['access_token']}"}
    if csrf:
        headers["X-CSRF-Token"] = csrf
    return headers
