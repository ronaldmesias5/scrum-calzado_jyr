"""Seed test users for development and demo purposes.

¿Qué? Migración que inserta usuarios de prueba para desarrollo:
      - 1 Admin (jefe del sistema) — acceso total
      - 1 Employee (operario) — gestión de producción
      - 1 Client (cliente) — compras

¿Para qué? Tener cuentas listas para hacer login sin registrarse.
           Facilita testing, demos y que el jefe vea dashboard inmediatamente.

¿Impacto? En downgrade elimina estos usuarios de prueba.
          Solo usar en desarrollo — en producción NO.

Revision ID: 004_seed_test_users
Revises: 003_seed_catalog_data
Create Date: 2026-03-25 00:00:03.000000
"""

from typing import Sequence, Union

from alembic import op
from passlib.context import CryptContext

revision: str = "004_seed_test_users"
down_revision: Union[str, Sequence[str], None] = "003_seed_catalog_data"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Contexto para hashear contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hashear contraseña con bcrypt."""
    return pwd_context.hash(password)


def upgrade() -> None:
    """Inserta usuarios de prueba para desarrollo.

    ¿Qué? Crea 3 usuarios de testing con contraseñas simples.
    ¿Para qué? Login y testing sin necesidad de registrarse.
    ¿Impacto? Seguro — solo en desarrollo tiene sentido.
              Producción debe tener usuarios reales únicamente.
    """

    # Obtener IDs de roles y tipos de documento
    op.execute(
        """
        INSERT INTO users (
            email,
            hashed_password,
            name_user,
            last_name,
            phone,
            identity_document,
            identity_document_type_id,
            role_id,
            is_active,
            is_validated,
            accepted_terms,
            occupation,
            created_at,
            updated_at
        )
        SELECT
            email,
            hashed_password,
            name_user,
            last_name,
            phone,
            identity_document,
            (SELECT id FROM type_document WHERE name_type_document = 'Cédula de Ciudadanía' LIMIT 1),
            role_id,
            is_active,
            is_validated,
            accepted_terms,
            occupation,
            NOW(),
            NOW()
        FROM (
            VALUES
            -- Usuario 1: Admin (Jefe del Sistema)
            (
                'admin@calzadojyr.com',
                %s,
                'Juan',
                'Administrador',
                '+57 300 123 4567',
                '1001234567',
                (SELECT id FROM roles WHERE name_role = 'admin' LIMIT 1),
                TRUE,
                TRUE,
                TRUE,
                'jefe'
            ),
            -- Usuario 2: Employee (Cortador/Operario)
            (
                'cortador@calzadojyr.com',
                %s,
                'Carlos',
                'Cortador',
                '+57 301 234 5678',
                '1002345678',
                (SELECT id FROM roles WHERE name_role = 'employee' LIMIT 1),
                TRUE,
                TRUE,
                TRUE,
                'cortador'
            ),
            -- Usuario 3: Client (Cliente)
            (
                'cliente@calzadojyr.com',
                %s,
                'María',
                'Cliente',
                '+57 302 345 6789',
                '1003456789',
                (SELECT id FROM roles WHERE name_role = 'client' LIMIT 1),
                TRUE,
                TRUE,
                TRUE,
                NULL
            )
        ) AS temp(
            email,
            hashed_password,
            name_user,
            last_name,
            phone,
            identity_document,
            role_id,
            is_active,
            is_validated,
            accepted_terms,
            occupation
        )
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email IN (
            'admin@calzadojyr.com',
            'cortador@calzadojyr.com',
            'cliente@calzadojyr.com'
        ))
        """
        % (
            get_password_hash("admin123"),
            get_password_hash("cortador123"),
            get_password_hash("cliente123"),
        )
    )


def downgrade() -> None:
    """Revierte la migración: elimina usuarios de prueba.

    ¿Qué? Borra los usuarios de testing.
    ¿Para qué? Permitir deshacer si algo sale mal.
    ¿Impacto? Seguro — solo borra usuarios de testing.
    """

    op.execute(
        """
        DELETE FROM users WHERE email IN (
            'admin@calzadojyr.com',
            'cortador@calzadojyr.com',
            'cliente@calzadojyr.com'
        )
        """
    )
