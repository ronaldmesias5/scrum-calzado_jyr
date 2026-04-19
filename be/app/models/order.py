"""
Archivo: be/app/models/order.py
Descripción: Modelo ORM SQLAlchemy para la tabla `orders` y `order_details`.

¿Qué?
  Define pedidos de clientes: orden con múltiples líneas de detalle.
  Cada pedido puede tener múltiples productos en diferentes tallas y colores.
  
¿Para qué?
  - Almacenar pedidos realizados por clientes
  - Trackear estado de producción
  - Vincular con inventario y productos
  - Mantener historial de pedidos
  
¿Impacto?
  CRÍTICO - Base del negocio (pedidos = ingresos principales)
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class OrderStatus(str, Enum):
    """Estados posibles de un pedido (deben coincidir con ENUM de BD)"""
    pendiente = "pendiente"
    en_progreso = "en_progreso"
    completado = "completado"
    entregado = "entregado"
    cancelado = "cancelado"


class Order(Base):
    """Modelo ORM para la tabla `orders` de pedidos de clientes."""

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Cliente
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
        comment="Referencia al cliente que realizó el pedido",
    )

    # Detalles del pedido
    total_pairs: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Total de pares en todo el pedido",
    )

    # Estado
    state: Mapped[str] = mapped_column(
        SQLEnum(OrderStatus, name='order_status', create_type=False),
        nullable=False,
        default=OrderStatus.pendiente,
        comment="Estado actual del pedido",
    )

    # Fechas
    delivery_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Fecha estimada de entrega",
    )

    creation_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Fecha de creación del pedido",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Soft delete",
    )

    # ────────────────────────────────────────────────────────────────────────────
    # 🔐 Auditoría
    # ────────────────────────────────────────────────────────────────────────────

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        comment="Usuario que creó la orden",
    )

    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        comment="Usuario que actualizó la orden",
    )

    # ────────────────────────────────────────────────────────────────────────────
    # 🔗 Relaciones
    # ────────────────────────────────────────────────────────────────────────────

    # Relación con OrderDetail (líneas de pedido)
    details: Mapped[list["OrderDetail"]] = relationship(
        "OrderDetail",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # Relación con User (cliente)
    customer: Mapped["User"] = relationship(
        "User",
        foreign_keys=[customer_id],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, customer_id={self.customer_id}, total_pairs={self.total_pairs}, state={self.state})>"


class OrderDetail(Base):
    """Modelo ORM para la tabla `order_details` de líneas de pedido."""

    __tablename__ = "order_details"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Relación con pedido
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id"),
        nullable=False,
        index=True,
        comment="Referencia al pedido padre",
    )

    # Producto
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False,
        index=True,
        comment="Referencia al producto pedido",
    )

    # Especificaciones
    size: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Talla (ej: 39, 40, 41, etc.)",
    )

    colour: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Color del producto",
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="Cantidad de pares",
    )

    observations: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Observaciones específicas del producto",
    )

    # Estado
    state: Mapped[str] = mapped_column(
        SQLEnum(OrderStatus, name='order_status', create_type=False),
        nullable=False,
        default=OrderStatus.pendiente,
        comment="Estado de esta línea del pedido",
    )

    # Fechas
    order_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="Fecha de la orden",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Soft delete",
    )

    # ────────────────────────────────────────────────────────────────────────────
    # 🔐 Auditoría
    # ────────────────────────────────────────────────────────────────────────────

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        comment="Usuario que creó la línea de pedido",
    )

    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        comment="Usuario que actualizó la línea de pedido",
    )

    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        comment="Usuario que eliminó la línea de pedido",
    )

    # ────────────────────────────────────────────────────────────────────────────
    # 🔗 Relaciones
    # ────────────────────────────────────────────────────────────────────────────

    # Relación inversa con Order
    order: Mapped[Order] = relationship(
        "Order",
        back_populates="details",
    )

    # Relación con Product
    product: Mapped["Product"] = relationship(
        "Product",
        lazy="selectin",
    )

    created_by_user = relationship(
        "User",
        foreign_keys=[created_by],
        remote_side="User.id",
        primaryjoin="OrderDetail.created_by == User.id",
    )

    updated_by_user = relationship(
        "User",
        foreign_keys=[updated_by],
        remote_side="User.id",
        primaryjoin="OrderDetail.updated_by == User.id",
    )

    deleted_by_user = relationship(
        "User",
        foreign_keys=[deleted_by],
        remote_side="User.id",
        primaryjoin="OrderDetail.deleted_by == User.id",
    )

    def __repr__(self) -> str:
        return f"<OrderDetail(order_id={self.order_id}, product_id={self.product_id}, size={self.size}, amount={self.amount})>"

