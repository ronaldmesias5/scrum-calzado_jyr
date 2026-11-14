# ════════════════════════════════════════
# 📄 Migración que inserta datos iniciales en las tablas:
# ════════════════════════════════════════
# 002_seed_initial_data | Revises: 001_create_initial_schema | Creada: 2026-03-25 00:00:01.000000

from typing import Sequence, Union

from alembic import op

# Identificadores de esta migración
revision: str = "002_seed_initial_data"
down_revision: Union[str, Sequence[str], None] = "001_create_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Inserta datos iniciales en la base de datos."""

    # ═══════════════════════════════════════════════════════════
    # INSERTAR ROLES
    # ═══════════════════════════════════════════════════════════
    op.execute(
        """
        INSERT INTO roles (name_role, description_role, created_at, updated_at)
        VALUES
            ('admin', 'Administrador del sistema — acceso completo a código, configuración y datos', NOW(), NOW()),
            ('employee', 'Empleado de la fábrica — gestión de tareas, producción y operaciones', NOW(), NOW()),
            ('client', 'Cliente — gestión de pedidos, visualización de catálogo y seguimiento', NOW(), NOW())
        ON CONFLICT (name_role) DO NOTHING;
        """
    )

    # ═══════════════════════════════════════════════════════════
    # INSERTAR TIPOS DE DOCUMENTO
    # ═══════════════════════════════════════════════════════════
    op.execute(
        """
        INSERT INTO type_document (name_type_document, created_at, updated_at)
        VALUES
            ('Cédula de Ciudadanía', NOW(), NOW()),
            ('Cédula de Extranjería', NOW(), NOW()),
            ('Pasaporte', NOW(), NOW()),
            ('Permiso de Permanencia', NOW(), NOW()),
            ('NIT (Empresa)', NOW(), NOW()),
            ('Tarjeta de Identidad', NOW(), NOW())
        ON CONFLICT (name_type_document) DO NOTHING;
        """
    )


def downgrade() -> None:
    """Revierte la migración: elimina los datos iniciales."""

    op.execute("DELETE FROM roles WHERE name_role IN ('admin', 'employee', 'client')")
    op.execute(
        """
        DELETE FROM type_document WHERE name_type_document IN
        ('Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 
         'Permiso de Permanencia', 'NIT (Empresa)', 'Tarjeta de Identidad')
        """
    )
