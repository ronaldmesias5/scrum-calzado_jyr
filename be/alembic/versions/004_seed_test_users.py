"""Seed initial jefe user for development and demo purposes.

¿Qué? Inserta el usuario inicial del sistema (jefe de producción).
¿Para qué? Tener una cuenta lista para acceder al dashboard del jefe.
¿Impacto? Solo usar en desarrollo. En producción usar usuarios reales.

Revision ID: 004_seed_test_users
Revises: 003_seed_catalog_data
Create Date: 2026-03-25 00:00:03.000000
"""

from typing import Sequence, Union
from alembic import op
from sqlalchemy import text
from passlib.context import CryptContext

revision: str = "004_seed_test_users"
down_revision: Union[str, Sequence[str], None] = "003_seed_catalog_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def upgrade() -> None:
    """Inserta el usuario jefe inicial usando JOINs dinámicos (portable)."""
    import os

    # ⛔ Seguridad: en producción NUNCA sembrar usuarios de prueba.
    # Las credenciales de este seed (publicadas en docs/README) permitirían
    # login como jefe en cualquier despliegue con BD nueva.
    if os.getenv("ENVIRONMENT", "development").lower() in ("prod", "production"):
        return

    op.get_bind().execute(
        text("""
        INSERT INTO users (
            email, hashed_password, name_user, last_name, phone,
            identity_document, identity_document_type_id, role_id,
            is_active, is_validated, accepted_terms, occupation,
            created_at, updated_at
        )
        SELECT
            'ronald.jefe@gmail.com',
            :hashed_pw,
            'Ronald',
            'Guerrero',
            '+57 312 845 7290',
            '1098765432',
            td.id,
            r.id,
            TRUE,
            TRUE,
            TRUE,
            'jefe'::occupation_type,
            NOW(),
            NOW()
        FROM
            (SELECT id FROM roles WHERE name_role = 'employee' LIMIT 1) r
            CROSS JOIN
            (SELECT id FROM type_document WHERE name_type_document = 'Cédula de Ciudadanía' LIMIT 1) td
        WHERE NOT EXISTS (
            SELECT 1 FROM users WHERE email = 'ronald.jefe@gmail.com'
        );
        """),
        {"hashed_pw": get_password_hash("Test123456!")}
    )


def downgrade() -> None:
    op.get_bind().execute(
        text("DELETE FROM users WHERE email = 'ronald.jefe@gmail.com'")
    )
