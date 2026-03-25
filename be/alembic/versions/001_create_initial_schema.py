"""Create initial database schema with all tables, enums, and indexes.

¿Qué? Migración inicial que crea toda la estructura de la base de datos:
      - Tipos ENUM para estados y categorías
      - Todas las tablas del proyecto (roles, users, products, orders, etc.)
      - Funciones y triggers para auditoría (set_updated_at)
      - Índices para optimizar consultas

¿Para qué? Establecer la estructura base del sistema de gestión de calzado.
           Incluye usuarios, inventario, pedidos, tareas, incidencias y notificaciones.

¿Impacto? Primera migración — todas las demás dependen de esta.
          Sin esta migración, la base de datos no tiene ninguna tabla.

Revision ID: 001_create_initial_schema
Revises:
Create Date: 2026-03-25 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# ¿Qué? Identificadores que Alembic usa para construir el grafo de migraciones.
# ¿Para qué? down_revision=None indica que esta es la primera migración (raíz).
# ¿Impacto? Alterar estos valores rompe el historial y puede causar errores al migrar.
revision: str = "001_create_initial_schema"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Aplica la migración: crea toda la estructura inicial de la BD.

    ¿Qué? Crea tipos ENUM, tablas, funciones y triggers necesarios para el sistema.
    ¿Para qué? Establecer la base de datos con todas las tablas interconectadas.
    ¿Impacto? Es seguro ejecutar en una BD vacía. En una BD existente fallará si
              las tablas ya existen.
    """

    # ══════════════════════════════════════════════════════════
    # PASO 0: Crear extensiones necesarias
    # ══════════════════════════════════════════════════════════
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ══════════════════════════════════════════════════════════
    # PASO 1: Crear tipos ENUM
    # ══════════════════════════════════════════════════════════
    op.execute("CREATE TYPE occupation_type AS ENUM ('jefe', 'cortador', 'guarnecedor', 'solador', 'emplantillador')")
    op.execute("CREATE TYPE supplies_movement_type AS ENUM ('entrada', 'salida')")
    op.execute("CREATE TYPE inventory_movement_type AS ENUM ('entrada', 'salida', 'ajuste')")
    op.execute("CREATE TYPE order_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado')")
    op.execute("CREATE TYPE task_status AS ENUM ('pendiente', 'en_progreso', 'completado', 'cancelado')")
    op.execute("CREATE TYPE task_priority AS ENUM ('baja', 'media', 'alta')")
    op.execute("CREATE TYPE task_type AS ENUM ('corte', 'guarnicion', 'soladura', 'emplantillado')")
    op.execute("CREATE TYPE incidence_status AS ENUM ('abierta', 'en_progreso', 'resuelta', 'cerrada')")
    op.execute("CREATE TYPE notification_type AS ENUM ('info', 'advertencia', 'error', 'exito')")

    # ══════════════════════════════════════════════════════════
    # PASO 2: Tabla roles (base de toda la estructura de permisos)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "roles",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name_role", sa.String(50), nullable=False, unique=True),
        sa.Column("description_role", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_roles_name_role", "roles", ["name_role"])

    # ══════════════════════════════════════════════════════════
    # PASO 3: Tabla type_document (tipos de documento de identidad)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "type_document",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name_type_document", sa.String(100), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_type_document_name", "type_document", ["name_type_document"])

    # ══════════════════════════════════════════════════════════
    # PASO 4: Tabla users (tabla central — mayoría de tablas la referencian)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("name_user", sa.String(255), nullable=False),
        sa.Column("last_name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("identity_document", sa.String(20), nullable=True),
        sa.Column("identity_document_type_id", UUID(as_uuid=True), nullable=True),
        sa.Column("role_id", UUID(as_uuid=True), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("is_validated", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("business_name", sa.String(255), nullable=True),
        sa.Column("occupation", sa.Enum("jefe", "cortador", "guarnecedor", "solador", "emplantillador", name="occupation_type"), nullable=True),
        sa.Column("session_version", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("accepted_terms", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("terms_accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("validated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["identity_document_type_id"], ["type_document.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["validated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role_id", "users", ["role_id"])
    op.create_index("ix_users_created_by", "users", ["created_by"])
    op.create_index("ix_users_updated_by", "users", ["updated_by"])
    op.create_index("ix_users_deleted_at", "users", ["deleted_at"])
    op.create_index("ix_users_email_active", "users", ["email"], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("ix_users_role_id_active", "users", ["role_id"], postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index("ix_users_role_validated", "users", ["role_id", "is_validated"], postgresql_where=sa.text("deleted_at IS NULL"))

    # ══════════════════════════════════════════════════════════
    # PASO 5: Tabla password_reset_tokens (recuperación de contraseña)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("token", sa.String(255), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_password_reset_tokens_token", "password_reset_tokens", ["token"])
    op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"])
    op.create_index("ix_password_reset_tokens_expires_at", "password_reset_tokens", ["expires_at"])

    # ══════════════════════════════════════════════════════════
    # PASO 6: Tabla supplies (suministros/materiales)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "supplies",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name_supplies", sa.String(255), nullable=False),
        sa.Column("description_supplies", sa.Text(), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_supplies_created_by", "supplies", ["created_by"])
    op.create_index("ix_supplies_deleted_at", "supplies", ["deleted_at"])

    # ══════════════════════════════════════════════════════════
    # PASO 7: Tabla supplies_movement (movimientos de suministros)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "supplies_movement",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("supplies_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("type_of_movement", sa.Enum("entrada", "salida", name="supplies_movement_type"), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("colour", sa.String(100), nullable=True),
        sa.Column("size", sa.String(50), nullable=True),
        sa.Column("movement_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["supplies_id"], ["supplies.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_supplies_movement_supplies_id", "supplies_movement", ["supplies_id"])
    op.create_index("ix_supplies_movement_user_id", "supplies_movement", ["user_id"])
    op.create_index("ix_supplies_movement_movement_date", "supplies_movement", ["movement_date"])

    # ══════════════════════════════════════════════════════════
    # PASO 8: Tabla categories (categorías de calzado)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "categories",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name_category", sa.String(255), nullable=False, unique=True),
        sa.Column("description_category", sa.Text(), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_categories_name", "categories", ["name_category"])
    op.create_index("ix_categories_created_by", "categories", ["created_by"])

    # ══════════════════════════════════════════════════════════
    # PASO 9: Tabla brands (marcas de calzado)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "brands",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name_brand", sa.String(255), nullable=False, unique=True),
        sa.Column("description_brand", sa.Text(), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_brands_name", "brands", ["name_brand"])
    op.create_index("ix_brands_created_by", "brands", ["created_by"])

    # ══════════════════════════════════════════════════════════
    # PASO 10: Tabla styles (estilos de calzado)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "styles",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("brand_id", UUID(as_uuid=True), nullable=False),
        sa.Column("name_style", sa.String(255), nullable=False),
        sa.Column("description_style", sa.Text(), nullable=True),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["brand_id"], ["brands.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_styles_brand_id", "styles", ["brand_id"])
    op.create_index("ix_styles_created_by", "styles", ["created_by"])

    # ══════════════════════════════════════════════════════════
    # PASO 11: Tabla products (productos — calzado)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "products",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("category_id", UUID(as_uuid=True), nullable=False),
        sa.Column("brand_id", UUID(as_uuid=True), nullable=False),
        sa.Column("style_id", UUID(as_uuid=True), nullable=False),
        sa.Column("name_product", sa.String(255), nullable=False),
        sa.Column("color", sa.String(100), nullable=True),
        sa.Column("description_product", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("insufficient_threshold", sa.Integer(), nullable=False, server_default=sa.text("10")),
        sa.Column("state", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["brand_id"], ["brands.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["style_id"], ["styles.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_category_id", "products", ["category_id"])
    op.create_index("ix_products_brand_id", "products", ["brand_id"])
    op.create_index("ix_products_style_id", "products", ["style_id"])
    op.create_index("ix_products_created_by", "products", ["created_by"])

    # ══════════════════════════════════════════════════════════
    # PASO 12: Tabla inventory (inventario de productos)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "inventory",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("product_id", UUID(as_uuid=True), nullable=False),
        sa.Column("size", sa.String(50), nullable=False),
        sa.Column("colour", sa.String(100), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("minimum_stock", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inventory_product_id", "inventory", ["product_id"])
    op.create_index("ix_inventory_product_size_colour", "inventory", ["product_id", "size", "colour"])
    op.create_index("ix_inventory_minimum_stock", "inventory", ["minimum_stock"], postgresql_where=sa.text("amount <= minimum_stock"))

    # ══════════════════════════════════════════════════════════
    # PASO 13: Tabla inventory_movement (movimientos de inventario)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "inventory_movement",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("product_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("type_of_movement", sa.Enum("entrada", "salida", "ajuste", name="inventory_movement_type"), nullable=False),
        sa.Column("size", sa.String(50), nullable=True),
        sa.Column("colour", sa.String(100), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("reason", sa.String(255), nullable=True),
        sa.Column("movement_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_inventory_movement_product_id", "inventory_movement", ["product_id"])
    op.create_index("ix_inventory_movement_user_id", "inventory_movement", ["user_id"])
    op.create_index("ix_inventory_movement_movement_date", "inventory_movement", ["movement_date"])

    # ══════════════════════════════════════════════════════════
    # PASO 14: Tabla tasks (tareas de producción)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "tasks",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("assigned_to", UUID(as_uuid=True), nullable=False),
        sa.Column("description_task", sa.Text(), nullable=False),
        sa.Column("priority", sa.Enum("baja", "media", "alta", name="task_priority"), nullable=False),
        sa.Column("type", sa.Enum("corte", "guarnicion", "soladura", "emplantillado", name="task_type"), nullable=False),
        sa.Column("status", sa.Enum("pendiente", "en_progreso", "completado", "cancelado", name="task_status"), nullable=False, server_default=sa.text("'pendiente'")),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("assignment_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_assigned_to", "tasks", ["assigned_to"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_created_by", "tasks", ["created_by"])
    op.create_index("ix_tasks_deadline", "tasks", ["deadline"], postgresql_where=sa.text("deadline IS NOT NULL"))
    op.create_index("ix_tasks_by_status_deadline", "tasks", ["status", "deadline"], postgresql_where=sa.text("deadline IS NOT NULL"))

    # ══════════════════════════════════════════════════════════
    # PASO 15: Tabla orders (pedidos de clientes)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "orders",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("customer_id", UUID(as_uuid=True), nullable=False),
        sa.Column("total_pairs", sa.Integer(), nullable=False),
        sa.Column("state", sa.Enum("pendiente", "en_progreso", "completado", "cancelado", name="order_status"), nullable=False, server_default=sa.text("'pendiente'")),
        sa.Column("delivery_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("creation_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])
    op.create_index("ix_orders_state", "orders", ["state"])
    op.create_index("ix_orders_created_by", "orders", ["created_by"])
    op.create_index("ix_orders_delivery_date", "orders", ["delivery_date"], postgresql_where=sa.text("delivery_date IS NOT NULL"))
    op.create_index("ix_orders_by_state_delivery", "orders", ["state", "delivery_date"], postgresql_where=sa.text("delivery_date IS NOT NULL"))

    # ══════════════════════════════════════════════════════════
    # PASO 16: Tabla order_details (detalles de cada pedido)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "order_details",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("order_id", UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), nullable=False),
        sa.Column("size", sa.String(50), nullable=False),
        sa.Column("colour", sa.String(100), nullable=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("state", sa.Enum("pendiente", "en_progreso", "completado", "cancelado", name="order_status"), nullable=False, server_default=sa.text("'pendiente'")),
        sa.Column("order_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_details_order_id", "order_details", ["order_id"])
    op.create_index("ix_order_details_product_id", "order_details", ["product_id"])
    op.create_index("ix_order_details_state", "order_details", ["state"])

    # ══════════════════════════════════════════════════════════
    # PASO 17: Tabla vale (vales de material)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "vale",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("order_id", UUID(as_uuid=True), nullable=False),
        sa.Column("size", sa.String(50), nullable=True),
        sa.Column("colour", sa.String(100), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("creation_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vale_order_id", "vale", ["order_id"])
    op.create_index("ix_vale_created_by", "vale", ["created_by"])
    op.create_index("ix_vale_creation_date", "vale", ["creation_date"], postgresql_args={"descending": True})

    # ══════════════════════════════════════════════════════════
    # PASO 18: Tabla detail_vale (detalles de vales)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "detail_vale",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("task_id", UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("vale_id", UUID(as_uuid=True), nullable=False),
        sa.Column("size", sa.String(50), nullable=True),
        sa.Column("colour", sa.String(100), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("creation_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["vale_id"], ["vale.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_detail_vale_vale_id", "detail_vale", ["vale_id"])
    op.create_index("ix_detail_vale_task_id", "detail_vale", ["task_id"])
    op.create_index("ix_detail_vale_product_id", "detail_vale", ["product_id"])
    op.create_index("ix_detail_vale_user_id", "detail_vale", ["user_id"])

    # ══════════════════════════════════════════════════════════
    # PASO 19: Tabla incidence (incidencias/problemas)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "incidence",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("task_id", UUID(as_uuid=True), nullable=False),
        sa.Column("type_incidence", sa.String(100), nullable=False),
        sa.Column("description_incidence", sa.Text(), nullable=True),
        sa.Column("state", sa.Enum("abierta", "en_progreso", "resuelta", "cerrada", name="incidence_status"), nullable=False, server_default=sa.text("'abierta'")),
        sa.Column("report_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_incidence_task_id", "incidence", ["task_id"])
    op.create_index("ix_incidence_state", "incidence", ["state"])
    op.create_index("ix_incidence_created_by", "incidence", ["created_by"])
    op.create_index("ix_incidence_report_date", "incidence", ["report_date"], postgresql_args={"descending": True})
    op.create_index("ix_incidence_by_state_date", "incidence", ["state", "report_date"], postgresql_where=sa.text("state != 'cerrada'"), postgresql_args={"descending": True})

    # ══════════════════════════════════════════════════════════
    # PASO 20: Tabla notifications (notificaciones)
    # ══════════════════════════════════════════════════════════
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), nullable=False, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("title_notification", sa.String(255), nullable=False),
        sa.Column("message_notification", sa.Text(), nullable=False),
        sa.Column("type_notification", sa.Enum("info", "advertencia", "error", "exito", name="notification_type"), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        sa.Column("updated_by", UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_by", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])
    op.create_index("ix_notifications_created_by", "notifications", ["created_by"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"], postgresql_args={"descending": True})

    # ══════════════════════════════════════════════════════════
    # PASO 21: Crear función y triggers para updated_at automático
    # ══════════════════════════════════════════════════════════
    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$;
    """)

    # Crear triggers para todas las tablas que tienen updated_at
    tables_with_triggers = [
        "roles", "type_document", "users", "supplies", "supplies_movement",
        "categories", "brands", "styles", "products", "inventory", "inventory_movement",
        "tasks", "orders", "order_details", "vale", "detail_vale", "incidence", "notifications"
    ]
    
    for table in tables_with_triggers:
        op.execute(f"""
            CREATE OR REPLACE TRIGGER trg_{table}_updated_at
                BEFORE UPDATE ON {table}
                FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
        """)


def downgrade() -> None:
    """Revierte la migración: elimina todas las tablas, tipos y funciones.

    ¿Qué? Descrea toda la estructura creada en upgrade().
    ¿Para qué? Permitir deshacer la migración si algo sale mal.
    ¿Impacto? ¡DESTRUCTIVO! Se pierden TODOS los datos. Solo usar en desarrollo.
              Orden importa: hay que eliminar las tablas en orden inverso al que se crearon,
              respetando las dependencias de foreign keys.
    """

    # Eliminar triggers
    tables_with_triggers = [
        "notifications", "incidence", "detail_vale", "vale", "order_details", "orders",
        "tasks", "inventory_movement", "inventory", "products", "styles", "brands",
        "categories", "supplies_movement", "supplies", "users", "type_document", "roles"
    ]
    
    for table in tables_with_triggers:
        op.execute(f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table} CASCADE")

    # Eliminar función de trigger
    op.execute("DROP FUNCTION IF EXISTS set_updated_at() CASCADE")

    # Eliminar tablas en orden inverso (respetando FKs)
    op.drop_table("notifications")
    op.drop_table("incidence")
    op.drop_table("detail_vale")
    op.drop_table("vale")
    op.drop_table("order_details")
    op.drop_table("orders")
    op.drop_table("tasks")
    op.drop_table("inventory_movement")
    op.drop_table("inventory")
    op.drop_table("products")
    op.drop_table("styles")
    op.drop_table("supplies_movement")
    op.drop_table("supplies")
    op.drop_table("brands")
    op.drop_table("categories")
    op.drop_table("password_reset_tokens")
    op.drop_table("users")
    op.drop_table("type_document")
    op.drop_table("roles")

    # Eliminar tipos ENUM
    op.execute("DROP TYPE IF EXISTS notification_type CASCADE")
    op.execute("DROP TYPE IF EXISTS incidence_status CASCADE")
    op.execute("DROP TYPE IF EXISTS task_type CASCADE")
    op.execute("DROP TYPE IF EXISTS task_priority CASCADE")
    op.execute("DROP TYPE IF EXISTS task_status CASCADE")
    op.execute("DROP TYPE IF EXISTS order_status CASCADE")
    op.execute("DROP TYPE IF EXISTS inventory_movement_type CASCADE")
    op.execute("DROP TYPE IF EXISTS supplies_movement_type CASCADE")
    op.execute("DROP TYPE IF EXISTS occupation_type CASCADE")
