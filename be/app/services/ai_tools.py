"""
Archivo: be/app/services/ai_tools.py
Descripción: Tools con JWT para asistente IA (Fase 2, contexto por rol).

¿Qué?
  - buscar_productos(db, query, limit=5): búsqueda por texto en products + brands/styles.
  - consultar_mis_pedidos(db, user_id, limit=5): pedidos del cliente autenticado.
  - consultar_mis_tareas(db, user_id, limit=5): tareas asignadas al empleado.
  - consultar_inventario(db, query, limit=5): consulta stock de productos (solo jefe).
  - consultar_mis_incidencias(db, user_id, limit=5): incidencias del empleado/cliente.
  - get_user_context(user): contexto de rol/ocupación para prompt.
  - format_tool_context(user, db, query): orquesta tools según query y rol.

¿Para qué?
  - Fase 2: chat sabe quién eres (visitante/cliente/empleado/jefe) y consulta datos reales.
  - Evita exponer datos privados sin JWT (tools solo con user_id).

¿Impacto?
  Fase 2 — sin estos tools, chat no puede responder "¿dónde va mi pedido?".
  Modificar firmas rompe: ai_service.py, ai_chat.py.
  Dependencias: models/product.py, models/order.py, models/tasks.py, models/user.py
"""

import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.product import Product
from app.models.tasks import Task
from app.models.user import User

logger = logging.getLogger(__name__)


def get_user_context(user: User | None) -> str:
    """Retorna descripción de rol/ocupación para el prompt, con instrucciones de navegación por rol."""
    if not user:
        return (
            "Usuario: visitante no autenticado (sin acceso a pedidos/tareas privadas). "
            "Para hacer pedidos debe registrarse en la landing (RF-001). "
            "Puede ver catálogo público en /catalog sin registrarse. "
            "INSTRUCCIÓN: Si pregunta cómo hacer un pedido, dile que se registre en la landing como mayorista. "
            "El jefe validará su cuenta y tendrá acceso al catálogo mayorista para pedidos."
        )

    role_name = user.role.name_role if hasattr(user, "role") and user.role else "sin rol"
    occupation = user.occupation or "sin ocupación"
    name = f"{user.name_user} {user.last_name}".strip()

    if role_name == "client":
        return (
            f"Usuario: cliente autenticado, nombre {name}, email {user.email}, rol client. "
            f"INSTRUCCIÓN: Este usuario YA está autenticado como cliente. NO le digas que inicie sesión. "
            f"Si pregunta cómo hacer un pedido, dile que vaya a Dashboard Cliente > Catálogo Mayorista, "
            f"elija productos por talla/cantidad (mín 12 pares por estilo/talla) y confirme. "
            f"Sus pedidos están en Dashboard Cliente > Mis Pedidos (solo lectura, no puede editar ni cancelar). "
            f"Si reporta una incidencia, dile que vaya a Dashboard Cliente > Mis Incidencias > Reportar. "
            f"Si consulta reportes, dile que vaya a Dashboard Cliente > Reportes."
        )
    elif role_name == "admin" or occupation == "jefe":
        return (
            f"Usuario: jefe/admin autenticado, nombre {name}, email {user.email}, ocupación {occupation}, rol {role_name}. "
            f"INSTRUCCIÓN: Este usuario YA está autenticado como jefe. NO le digas que inicie sesión. "
            f"Si pregunta cómo hacer un pedido, dile que vaya a Dashboard Jefe > Pedidos > Nuevo Pedido, "
            f"seleccione cliente (o vacío para Stock), añada productos por talla/cantidad (mín 12 pares por estilo/talla), "
            f"confirme y luego asigne tareas en Dashboard Jefe > Tareas. "
            f"Él crea pedidos para clientes o para stock. "
            f"Gestiona catálogo en Dashboard Jefe > Catálogo, inventario en Dashboard Jefe > Inventario, "
            f"empleados en Dashboard Jefe > Empleados, clientes en Dashboard Jefe > Clientes, "
            f"usuarios en Dashboard Jefe > Usuarios, pérdidas en Dashboard Jefe > Pérdidas, "
            f"reportes en Dashboard Jefe > Reportes, alertas en Dashboard Jefe > Alertas, "
            f"insumos en Dashboard Jefe > Insumos y configuración en Dashboard Jefe > Configuración."
        )
    elif role_name == "employee":
        return (
            f"Usuario: empleado autenticado, nombre {name}, email {user.email}, ocupación {occupation}, rol employee. "
            f"INSTRUCCIÓN: Este usuario es empleado ({occupation}), NO crea pedidos. NO le digas que inicie sesión. "
            f"Si pregunta cómo hacer un pedido, explícale que los pedidos los crean el jefe o los clientes. "
            f"Él solo ejecuta tareas en Dashboard Empleado > Mis Tareas. "
            f"Como {occupation}, solo puede ver y reclamar tareas de {
                'corte' if occupation == 'cortador'
                else 'guarnición (costura)' if occupation == 'guarnecedor'
                else 'soladura (pegado de suelas)' if occupation == 'solador'
                else 'emplantillado (acabado)' if occupation == 'emplantillador'
                else 'su etapa'
            }. "
            f"Tareas disponibles en Dashboard Empleado > Tareas Disponibles. "
            f"Incidencias en Dashboard Empleado > Incidencias. "
            f"Reportes de rendimiento en Dashboard Empleado > Reportes."
        )
    else:
        return (
            f"Usuario: autenticado, nombre {name}, email {user.email}, rol {role_name}, ocupación {occupation}. "
            f"INSTRUCCIÓN: NO le digas que inicie sesión."
        )


def buscar_productos(db: Session, query: str, limit: int = 5) -> list[dict[str, Any]]:
    """
    Busca productos por texto en name_product, description, color.
    Retorna lista de dicts con id, name, brand, category, style, color, state.
    """
    if not query.strip():
        return []

    try:
        # Búsqueda simple ILIKE en productos
        pattern = f"%{query.strip()}%"
        stmt = (
            select(Product)
            .where(
                (Product.deleted_at.is_(None))
                & (
                    (Product.name_product.ilike(pattern))
                    | (Product.description_product.ilike(pattern))
                    | (Product.color.ilike(pattern))
                )
            )
            .limit(limit)
        )
        products = db.execute(stmt).scalars().all()

        results: list[dict[str, Any]] = []
        for p in products:
            brand_name = p.brand.name_brand if hasattr(p, "brand") and p.brand else "Sin marca"
            category_name = (
                p.category.name_category
                if hasattr(p, "category") and p.category
                else "Sin categoría"
            )
            style_name = p.style.name_style if hasattr(p, "style") and p.style else "Sin estilo"
            results.append(
                {
                    "id": str(p.id),
                    "name": p.name_product,
                    "brand": brand_name,
                    "category": category_name,
                    "style": style_name,
                    "color": p.color,
                    "state": "disponible" if p.state else "no disponible",
                    "description": p.description_product,
                }
            )
        return results
    except Exception as e:
        logger.warning(f"[ai_tools] buscar_productos falló: {e}")
        return []


def consultar_mis_pedidos(db: Session, user_id: UUID, limit: int = 5) -> list[dict[str, Any]]:
    """
    Consulta pedidos del cliente (customer_id == user_id).
    Solo con JWT válido. Retorna lista de dicts con id, state, total_pairs, delivery_date.
    """
    try:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Order)
            .where((Order.customer_id == user_id) & (Order.deleted_at.is_(None)))
            .options(selectinload(Order.details))
            .order_by(Order.creation_date.desc())
            .limit(limit)
        )
        orders = db.execute(stmt).scalars().unique().all()

        results: list[dict[str, Any]] = []
        for o in orders:
            results.append(
                {
                    "id": str(o.id),
                    "id_short": str(o.id)[:8],
                    "state": o.state,
                    "total_pairs": o.total_pairs,
                    "delivery_date": o.delivery_date.isoformat() if o.delivery_date else None,
                    "creation_date": o.creation_date.isoformat() if o.creation_date else None,
                    "details_count": len(o.details) if hasattr(o, "details") and o.details else 0,
                }
            )
        return results
    except Exception as e:
        logger.warning(f"[ai_tools] consultar_mis_pedidos falló: {e}")
        return []


def consultar_mis_tareas(db: Session, user_id: UUID, limit: int = 5) -> list[dict[str, Any]]:
    """
    Consulta tareas asignadas al empleado (assigned_to == user_id).
    Solo con JWT válido.
    """
    try:
        stmt = (
            select(Task)
            .where(Task.assigned_to == user_id)
            .order_by(Task.assignment_date.desc())
            .limit(limit)
        )
        tasks = db.execute(stmt).scalars().all()

        results: list[dict[str, Any]] = []
        for t in tasks:
            results.append(
                {
                    "id": str(t.id),
                    "id_short": str(t.id)[:8],
                    "type": t.type,
                    "status": t.status,
                    "priority": t.priority,
                    "amount": t.amount,
                    "deadline": t.deadline.isoformat() if t.deadline else None,
                    "description": t.description_task[:100] if t.description_task else "",
                }
            )
        return results
    except Exception as e:
        logger.warning(f"[ai_tools] consultar_mis_tareas falló: {e}")
        return []


def consultar_inventario(
    db: Session, query: str, limit: int = 5
) -> list[dict[str, Any]]:
    """
    Consulta inventario de productos (solo jefe/admin).
    Busca por nombre de producto y retorna stock por talla.
    """
    if not query.strip():
        return []

    try:
        from app.models.inventory import Inventory

        pattern = f"%{query.strip()}%"
        stmt = (
            select(Product)
            .where(
                (Product.deleted_at.is_(None))
                & (
                    (Product.name_product.ilike(pattern))
                    | (Product.color.ilike(pattern))
                )
            )
            .limit(limit)
        )
        products = db.execute(stmt).scalars().all()

        results: list[dict[str, Any]] = []
        for p in products:
            inv_stmt = select(Inventory).where(Inventory.product_id == p.id)
            inventories = db.execute(inv_stmt).scalars().all()
            stock_by_size = [
                {
                    "size": inv.size,
                    "colour": inv.colour,
                    "amount": inv.amount,
                    "reserved": inv.reserved,
                }
                for inv in inventories
            ]
            brand_name = p.brand.name_brand if hasattr(p, "brand") and p.brand else "Sin marca"
            results.append(
                {
                    "product_id": str(p.id),
                    "name": p.name_product,
                    "brand": brand_name,
                    "color": p.color,
                    "state": "disponible" if p.state else "no disponible",
                    "stock": stock_by_size,
                }
            )
        return results
    except Exception as e:
        logger.warning(f"[ai_tools] consultar_inventario falló: {e}")
        return []


def consultar_mis_incidencias(
    db: Session, user_id: UUID, limit: int = 5
) -> list[dict[str, Any]]:
    """
    Consulta incidencias del empleado o cliente autenticado.
    Para empleados: incidencias de sus tareas (Incidence → Task.assigned_to).
    Para clientes: incidencias de producto (PendingProductIncidence → customer_id).
    """
    try:
        from app.models.incidence import Incidence
        from app.models.pending_incidence import PendingProductIncidence
        from app.models.tasks import Task

        # Determinar el rol del usuario
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            return []

        role_name = user.role.name_role if hasattr(user, "role") and user.role else ""

        results: list[dict[str, Any]] = []

        if role_name == "employee":
            # Incidencias vinculadas a tareas del empleado
            stmt = (
                select(Incidence)
                .join(Task, Incidence.task_id == Task.id)
                .where(
                    (Task.assigned_to == user_id)
                    & (Incidence.deleted_at.is_(None))
                )
                .order_by(Incidence.created_at.desc())
                .limit(limit)
            )
            incidences = db.execute(stmt).scalars().all()
            for inc in incidences:
                results.append(
                    {
                        "id": str(inc.id),
                        "id_short": str(inc.id)[:8],
                        "type": inc.type_incidence,
                        "state": inc.state,
                        "description": (inc.description_incidence[:100] if inc.description_incidence else ""),
                        "created_at": inc.created_at.isoformat() if inc.created_at else None,
                    }
                )

        elif role_name == "client":
            # Incidencias de producto reportadas por el cliente
            stmt = (
                select(PendingProductIncidence)
                .where(
                    (PendingProductIncidence.customer_id == user_id)
                    & (PendingProductIncidence.deleted_at.is_(None))
                )
                .order_by(PendingProductIncidence.created_at.desc())
                .limit(limit)
            )
            pendings = db.execute(stmt).scalars().all()
            for p in pendings:
                results.append(
                    {
                        "id": str(p.id),
                        "id_short": str(p.id)[:8],
                        "type": "producto",
                        "state": p.status,
                        "description": (p.description[:100] if p.description else ""),
                        "created_at": p.created_at.isoformat() if p.created_at else None,
                    }
                )

        return results
    except Exception as e:
        logger.warning(f"[ai_tools] consultar_mis_incidencias falló: {e}")
        return []


def format_tool_context(user: User | None, db: Session, query: str) -> str:
    """
    Orquesta tools según query y rol. Retorna texto para añadir al prompt.
    - Si query contiene "pedido" o "orden" y user es client/jefe → consulta pedidos.
    - Si query contiene "tarea" y user es employee/jefe → consulta tareas.
    - Si query contiene "inventario" o "stock" y user es jefe → consulta inventario.
    - Si query contiene "incidencia" y user es employee/client → consulta incidencias.
    - Si query parece búsqueda de producto → buscar_productos.
    Siempre incluye get_user_context.
    """
    parts: list[str] = [get_user_context(user)]

    if not user:
        # Visitante: solo contexto, sin datos privados
        return "\n".join(parts)

    lowered = query.lower()

    # Detectar intención de pedidos
    if any(kw in lowered for kw in ["pedido", "orden", "order", "compra"]):
        # Solo clientes y jefe pueden ver pedidos
        role_name = user.role.name_role if hasattr(user, "role") and user.role else ""
        if role_name == "client" or user.occupation == "jefe" or role_name == "admin":
            pedidos = consultar_mis_pedidos(db, user.id, limit=5)
            if pedidos:
                pedidos_text = "\n".join(
                    f"- Pedido #{p['id_short']} estado {p['state']} {p['total_pairs']} pares entrega {p['delivery_date'] or 'sin fecha'}"
                    for p in pedidos
                )
                parts.append(f"Tus pedidos recientes:\n{pedidos_text}")
            else:
                parts.append("No tienes pedidos registrados.")

    # Detectar intención de tareas
    if any(kw in lowered for kw in ["tarea", "task", "vale", "producción", "produccion"]) and (
        user.occupation in ("jefe", "cortador", "guarnecedor", "solador", "emplantillador")
        or (hasattr(user, "role") and user.role and user.role.name_role == "employee")
        or user.occupation == "jefe"
    ):
        tareas = consultar_mis_tareas(db, user.id, limit=5)
        if tareas:
            tareas_text = "\n".join(
                f"- Tarea #{t['id_short']} tipo {t['type']} estado {t['status']} prioridad {t['priority']} {t['amount']} pares"
                for t in tareas
            )
            parts.append(f"Tus tareas recientes:\n{tareas_text}")
        else:
            parts.append("No tienes tareas asignadas.")

    # Detectar intención de inventario (solo jefe/admin)
    if any(kw in lowered for kw in ["inventario", "stock", "bodega", "pares"]):
        role_name = user.role.name_role if hasattr(user, "role") and user.role else ""
        if user.occupation == "jefe" or role_name == "admin":
            inventario = consultar_inventario(db, query, limit=3)
            if inventario:
                inv_text = "\n".join(
                    f"- {p['name']} ({p['brand']} {p['color'] or 'varios'}): {len(p['stock'])} registros de stock"
                    for p in inventario
                )
                parts.append(f"Inventario encontrado:\n{inv_text}")

    # Detectar intención de incidencias
    if any(kw in lowered for kw in ["incidencia", "problema", "defecto", "perdida"]):
        role_name = user.role.name_role if hasattr(user, "role") and user.role else ""
        if role_name in ("employee", "client"):
            incidencias = consultar_mis_incidencias(db, user.id, limit=5)
            if incidencias:
                inc_text = "\n".join(
                    f"- Incidencia #{i['id_short']} tipo {i['type']} estado {i['state']}"
                    for i in incidencias
                )
                parts.append(f"Tus incidencias recientes:\n{inc_text}")
            else:
                parts.append("No tienes incidencias registradas.")

    # Búsqueda de productos si query parece producto (opcional, siempre útil)
    # Solo si no es pedido/tarea específico, para no saturar prompt
    if any(
        kw in lowered
        for kw in ["producto", "zapato", "bota", "tenis", "calzado", "marca", "talla", "color"]
    ):
        productos = buscar_productos(db, query, limit=3)
        if productos:
            prod_text = "\n".join(
                f"- {p['name']} ({p['brand']} {p['style']} {p['category']} color {p['color'] or 'varios'} {p['state']})"
                for p in productos
            )
            parts.append(f"Productos encontrados:\n{prod_text}")

    return "\n\n".join(parts)
