"""
Archivo: be/app/seed_data.py
Descripción: Script de seed para cargar datos iniciales (roles, tipos de documentos).

¿Qué?
  Exporta 2 funciones:
  - seed_roles(): Inserta 3 roles (admin, employee, client) con UUIDs fijos
  - seed_type_documents(): Inserta 6 tipos de documentos (CC, TI, Pasaporte, etc.)
  Usa db.merge() para evitar duplicados (INSERT ... ON CONFLICT equivalente)
  Verifica count() antes de insertar (skip si ya existen)
  
¿Para qué?
  - Garantizar datos iniciales desde código Python (no solo SQL)
  - Facilitar testing (crear BD desde cero con seed_roles())
  - Alternativa a scripts SQL (seed_data.py puede llamarse desde main.py)
  - Logs claros: ✅ OK, 🔄 Insertando, ❌ Error
  
¿Impacto?
  MEDIO — Se ejecuta en startup del backend (main.py lifespan).
  Si falla seed_roles(), usuarios no pueden crearse (FK constraint falla).
  Modificar UUIDs rompe: scripts que hardcodean UUIDs (crear_usuario_ronald.py).
  Dependencias: models/role.py, models/type_document.py, database.py (SessionLocal)
"""

import uuid
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.role import Role
from app.models.type_document import TypeDocument
from app.models.user import User
from app.models.product import Product
from app.models.brand import Brand
from app.models.style import Style
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.order import Order, OrderItem, OrderStatus
from app.utils.security import hash_password
import random

logger = logging.getLogger(__name__)


def seed_roles(db: Session) -> bool:
    """
    Inserta los 3 roles principales si no existen.
    
    Return:
        True si se insertaron o ya existían, False si hubo error.
    """
    try:
        # Verificar si ya existen los roles
        if db.query(Role).count() > 0:
            print(f"✅ Roles ya existen ({db.query(Role).count()} encontrados)")
            return True
        
        print("🔄 Insertando roles iniciales...")
        
        roles = [
            Role(
                id=uuid.UUID("10000000-0000-0000-0000-000000000001"),
                name_role="admin",
                description_role="Administrador del sistema"
            ),
            Role(
                id=uuid.UUID("20000000-0000-0000-0000-000000000001"),
                name_role="employee",
                description_role="Empleado de la fábrica"
            ),
            Role(
                id=uuid.UUID("30000000-0000-0000-0000-000000000001"),
                name_role="client",
                description_role="Cliente — gestión de pedidos"
            ),
        ]
        
        for role in roles:
            db.merge(role)  # USE MERGE para evitar duplicados
        
        db.commit()
        print("✅ Roles insertados exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error insertando roles: {str(e)}")
        db.rollback()
        return False


def seed_type_documents(db: Session) -> bool:
    """
    Inserta los tipos de documentos principales si no existen.
    
    Return:
        True si se insertaron o ya existían, False si hubo error.
    """
    try:
        # Verificar si ya existen
        if db.query(TypeDocument).count() > 0:
            print(f"✅ Tipos de documentos ya existen ({db.query(TypeDocument).count()} encontrados)")
            return True
        
        print("🔄 Insertando tipos de documentos...")
        
        type_docs = [
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                name_type_document="Cédula de Ciudadanía (CC)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
                name_type_document="Tarjeta de Identidad (TI)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
                name_type_document="Pasaporte"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000004"),
                name_type_document="Cédula de Extranjería (CE)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000005"),
                name_type_document="Permiso por Protección Temporal (PPT)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000006"),
                name_type_document="Documento de Identificación Personal (DIPS)"
            ),
        ]
        
        for doc_type in type_docs:
            db.merge(doc_type)  # USE MERGE para evitar duplicados
        
        db.commit()
        print("✅ Tipos de documentos insertados exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error insertando tipos de documentos: {str(e)}")
        db.rollback()
        return False


def seed_orders(db: Session) -> bool:
    """
    Inserta órdenes mayoristas de prueba si no existen.
    
    Cada orden puede tener múltiples estilos (items) con tallas y cantidades.
    Mínimo 12 pares por estilo/talla.
    
    Return:
        True si se insertaron o ya existían, False si hubo error.
    """
    try:
        # Verificar si ya existen
        if db.query(Order).count() > 0:
            print(f"✅ Órdenes ya existen ({db.query(Order).count()} encontradas)")
            return True
        
        print("🔄 Insertando órdenes mayoristas de prueba...")
        
        from app.models.order import OrderItem
        
        now = datetime.now(timezone.utc)
        
        orders = [
            # Orden 1: Pendiente con 2 estilos
            Order(
                id=uuid.uuid4(),
                order_code="ORD-001",
                customer_name="Calzado Pérez",
                contact_person="Juan Pérez",
                contact_email="juan.perez@calzadoperez.com",
                contact_phone="+57 310 234 5678",
                contact_address="Cra 15 #45-23, Bogotá",
                total_items=150,
                delivery_date=now + timedelta(days=15),
                notes="Cliente mayorista preferencial. Requiere empaque especial.",
                status=OrderStatus.PENDING,
                created_at=now - timedelta(days=5),
            ),
            # Orden 2: En Producción con 1 estilo
            Order(
                id=uuid.uuid4(),
                order_code="ORD-002",
                customer_name="Distribuidora Bogotá",
                contact_person="María Rodríguez",
                contact_email="maria@distribuidorabog.com",
                contact_phone="+57 320 555 1234",
                contact_address="Av. 68 #50-40, Bogotá",
                total_items=200,
                delivery_date=now + timedelta(days=20),
                notes="Pedido urgente. Prioridad alta.",
                status=OrderStatus.IN_PRODUCTION,
                created_at=now - timedelta(days=2),
            ),
            # Orden 3: Listo con múltiples estilos
            Order(
                id=uuid.uuid4(),
                order_code="ORD-003",
                customer_name="Zapatos al Mayor",
                contact_person="Carlos López",
                contact_email="carlos@zapatosalmayor.com",
                contact_phone="+57 315 777 3333",
                contact_address="Calle 10 #25-60, Medellín",
                total_items=96,
                delivery_date=now + timedelta(days=8),
                notes="Revisar calidad especialmente en puntadas.",
                status=OrderStatus.COMPLETED,
                created_at=now - timedelta(days=4),
            ),
            # Orden 4: Entregada
            Order(
                id=uuid.uuid4(),
                order_code="ORD-004",
                customer_name="Tiendas Elite",
                contact_person="Patricia Moreno",
                contact_email="patricia@tiendas-elite.com",
                contact_phone="+57 300 444 2222",
                contact_address="Cra 7 #12-80, Cali",
                total_items=120,
                delivery_date=now - timedelta(days=2),
                notes="Entrega confirmada.",
                status=OrderStatus.DELIVERED,
                created_at=now - timedelta(days=10),
            ),
            # Orden 5: Cancelada
            Order(
                id=uuid.uuid4(),
                order_code="ORD-005",
                customer_name="Calzados Centrales",
                contact_person="Roberto Gómez",
                contact_email="roberto@calzadoscentrales.com",
                contact_phone="+57 312 666 7777",
                contact_address="Cra 50 #30-15, Barranquilla",
                total_items=60,
                delivery_date=None,
                notes="Cancelado por cambio de especificaciones.",
                status=OrderStatus.CANCELLED,
                created_at=now - timedelta(days=7),
            ),
        ]
        
        # Agregar items (líneas de pedido) a cada orden
        items_map = {
            0: [  # Orden 1: For One y Super Star
                OrderItem(id=uuid.uuid4(), style_name="For One", style_category="Caballero", size="39", quantity=50),
                OrderItem(id=uuid.uuid4(), style_name="For One", style_category="Caballero", size="40", quantity=50),
                OrderItem(id=uuid.uuid4(), style_name="Super Star", style_category="Caballero", size="41", quantity=50),
            ],
            1: [  # Orden 2: Puma California
                OrderItem(id=uuid.uuid4(), style_name="Puma California", style_category="Caballero", size="38", quantity=100),
                OrderItem(id=uuid.uuid4(), style_name="Puma California", style_category="Caballero", size="39", quantity=100),
            ],
            2: [  # Orden 3: Nike Runner
                OrderItem(id=uuid.uuid4(), style_name="Nike Runner", style_category="Caballero", size="40", quantity=48),
                OrderItem(id=uuid.uuid4(), style_name="Nike Runner", style_category="Caballero", size="41", quantity=48),
            ],
            3: [  # Orden 4: Adidas Classic
                OrderItem(id=uuid.uuid4(), style_name="Adidas Classic", style_category="Dama", size="35", quantity=60),
                OrderItem(id=uuid.uuid4(), style_name="Adidas Classic", style_category="Dama", size="36", quantity=60),
            ],
            4: [  # Orden 5: Elegance Pro
                OrderItem(id=uuid.uuid4(), style_name="Elegance Pro", style_category="Caballero", size="42", quantity=60),
            ],
        }
        
        for idx, order in enumerate(orders):
            if idx in items_map:
                order.items = items_map[idx]
            db.merge(order)
        
        db.commit()
        print("✅ Órdenes mayoristas insertadas exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error insertando órdenes: {str(e)}")
        db.rollback()
        return False


def seed_admin(db: Session) -> bool:
    """
    Inserta un usuario jefe (empleado con cargo de jefe) si no existe.
    
    Return:
        True si se insertó o ya existía, False si hubo error.
    """
    try:
        # Verificar si ya existe el usuario jefe
        existing_jefe = db.query(User).filter(User.email == "ronald.jefe@gmail.com").first()
        if existing_jefe:
            print(f"✅ Jefe ya existe ({existing_jefe.email})")
            return True
        
        # Obtener rol employee
        employee_role = db.query(Role).filter(Role.name_role == "employee").first()
        if not employee_role:
            print("❌ Rol employee no existe")
            return False
        
        print("🔄 Insertando usuario jefe...")
        
        jefe_user = User(
            id=uuid.uuid4(),
            email="ronald.jefe@gmail.com",
            name_user="Ronald",
            last_name="Jefe",
            phone="+57 312 345 6789",
            hashed_password=hash_password("Test123456!"),
            role_id=employee_role.id,
            occupation="jefe",
            is_active=True,
            is_validated=True,
            validated_at=datetime.now(timezone.utc),
        )
        
        db.add(jefe_user)
        db.commit()
        print("✅ Usuario jefe insertado exitosamente")
        print("   Email: ronald.jefe@gmail.com")
        print("   Contraseña: Test123456!")
        return True
        
    except Exception as e:
        print(f"❌ Error insertando jefe: {str(e)}")
        db.rollback()
        return False


def seed_users(db: Session) -> bool:
    """
    Limpia todos los clientes de prueba y asegura que existan los 4 empleados.
    Ronald (jefe) ya lo maneja seed_admin().

    Siempre elimina todos los clientes de prueba.

    Return:
        True si todo OK, False si hubo error.
    """
    try:
        # ── 1. Eliminar TODOS los clientes ────────────────────────────────
        client_role = db.query(Role).filter(Role.name_role == "client").first()
        if client_role:
            deleted = (
                db.query(User)
                .filter(User.role_id == client_role.id)
                .delete(synchronize_session=False)
            )
            if deleted > 0:
                db.commit()
                print(f"🗑️  {deleted} cliente(s) eliminado(s) — sin clientes registrados")

        # ── 2. Obtener role de empleado ──────────────────────────────────
        employee_role = db.query(Role).filter(Role.name_role == "employee").first()
        if not employee_role:
            print("❌ Rol employee no encontrado — ejecuta seed_roles() primero")
            return False

        # ── 3. Definir solo los 4 empleados ──────────────────────────────
        users_data = [
            # Empleados
            dict(
                id=uuid.UUID("a1000000-0000-0000-0000-000000000001"),
                email="marina.emplantilladora@gmail.com",
                name_user="Marina",
                last_name="Leyton",
                phone="+57 311 111 0001",
                role_id=employee_role.id,
                occupation="emplantillador",
            ),
            dict(
                id=uuid.UUID("a1000000-0000-0000-0000-000000000002"),
                email="juan.cortador@gmail.com",
                name_user="Juan",
                last_name="Cortez",
                phone="+57 311 111 0002",
                role_id=employee_role.id,
                occupation="cortador",
            ),
            dict(
                id=uuid.UUID("a1000000-0000-0000-0000-000000000003"),
                email="pedro.solador@gmail.com",
                name_user="Pedro",
                last_name="Solis",
                phone="+57 311 111 0003",
                role_id=employee_role.id,
                occupation="solador",
            ),
            dict(
                id=uuid.UUID("a1000000-0000-0000-0000-000000000004"),
                email="laura.guarnecedor@gmail.com",
                name_user="Laura",
                last_name="Garcia",
                phone="+57 311 111 0004",
                role_id=employee_role.id,
                occupation="guarnecedor",
            ),
        ]

        now = datetime.now(timezone.utc)
        inserted = 0

        for data in users_data:
            existing = db.query(User).filter(User.email == data["email"]).first()
            if existing:
                continue
            user = User(
                id=data["id"],
                email=data["email"],
                name_user=data["name_user"],
                last_name=data["last_name"],
                phone=data["phone"],
                hashed_password=hash_password("Test123456!"),
                role_id=data["role_id"],
                occupation=data["occupation"],
                is_active=True,
                is_validated=True,
                validated_at=now,
                must_change_password=False,
            )
            db.add(user)
            inserted += 1

        if inserted > 0:
            db.commit()
            print(f"✅ {inserted} usuario(s) insertado(s) exitosamente")
        else:
            print("✅ Usuarios ya existen — sin cambios")

        return True

    except Exception as e:
        print(f"❌ Error en seed_users: {str(e)}")
        db.rollback()
        return False


def seed_catalog(db: Session) -> bool:
    """
    Inserta brands, categories, styles y products si no existen.
    
    Datos exactos del ESTADO_ACTUAL_BD.md (15 marzo 2026):
    - 5 brands (Nike, Adidas, Puma, New Balance, Reebok)
    - 3 categories (Dama, Caballero, Infantil)
    - 22 styles (con marcas asociadas)
    - 65 products (con estilos y categorías asociadas)
    
    Regla especial: Reebok Princesa solo en Dama + Infantil (NO Caballero)
    
    Return:
        True si se insertaron o ya existían, False si hubo error.
    """
    try:
        from app.models.brand import Brand
        from app.models.category import Category
        from app.models.style import Style
        from app.models.product import Product
        
        # ── 1. Verificar si ya está el catálogo poblado ────────────
        if db.query(Brand).count() > 0:
            print(f"✅ Catálogo ya existe ({db.query(Brand).count()} brands, {db.query(Category).count()} categorías, {db.query(Style).count()} estilos, {db.query(Product).count()} productos)")
            return True
        
        print("🔄 Insertando catálogo (brands, categorías, estilos, productos)...")
        
        # ── 2. Insertar 5 BRANDS ─────────────────────────────────────
        brands_data = [
            {"name": "Nike", "description": "Marca estadounidense de calzado y ropa deportiva"},
            {"name": "Adidas", "description": "Líder global en ropa y calzado deportivo"},
            {"name": "Puma", "description": "Marca internacional de calzado deportivo y casual"},
            {"name": "New Balance", "description": "Fabricante de calzado deportivo y casual"},
            {"name": "Reebok", "description": "Marca de calzado deportivo y fitness"},
        ]
        
        brands = {}
        for brand_data in brands_data:
            brand = Brand(
                id=uuid.uuid4(),
                name_brand=brand_data["name"],
                description_brand=brand_data["description"]
            )
            db.add(brand)
            brands[brand_data["name"]] = brand
        
        db.flush()  # Asegurar que los IDs se generen
        
        # ── 3. Insertar 3 CATEGORIES ─────────────────────────────────
        categories_data = [
            {"name": "Dama", "description": "Zapatos para mujeres"},
            {"name": "Caballero", "description": "Zapatos para hombres"},
            {"name": "Infantil", "description": "Zapatos para niños"},
        ]
        
        categories = {}
        for cat_data in categories_data:
            category = Category(
                id=uuid.uuid4(),
                name_category=cat_data["name"],
                description_category=cat_data["description"]
            )
            db.add(category)
            categories[cat_data["name"]] = category
        
        db.flush()  # Asegurar que los IDs se generen
        
        # ── 4. Insertar 22 STYLES (con referencia a brand) ──────────────
        styles_data = [
            # Nike (6 estilos)
            {"name": "Air Force One", "description": "Icónico zapato de Nike", "brand": "Nike"},
            {"name": "SB", "description": "Línea de skate de Nike", "brand": "Nike"},
            {"name": "Force One Bota", "description": "Air Force One en formato bota", "brand": "Nike"},
            {"name": "Air Jordan 1", "description": "Primer modelo de Air Jordan", "brand": "Nike"},
            {"name": "Air Jordan 11", "description": "Modelo emblemático Air Jordan", "brand": "Nike"},
            {"name": "Air Max", "description": "Tecnología Air Max de Nike", "brand": "Nike"},
            # Adidas (7 estilos)
            {"name": "Superstar", "description": "Clásico de Adidas", "brand": "Adidas"},
            {"name": "Forum", "description": "Diseño retro de Adidas", "brand": "Adidas"},
            {"name": "Ultraboost", "description": "Tecnología Boost de Adidas", "brand": "Adidas"},
            {"name": "Stan Smith", "description": "Icono del tenis de Adidas", "brand": "Adidas"},
            {"name": "Campus", "description": "Clásico vinilo de Adidas", "brand": "Adidas"},
            {"name": "Varial", "description": "Zapato de skate Adidas", "brand": "Adidas"},
            {"name": "Neo", "description": "Línea casual Neo de Adidas", "brand": "Adidas"},
            # Puma (1 estilo)
            {"name": "California", "description": "Modelo clásico de Puma", "brand": "Puma"},
            # New Balance (4 estilos)
            {"name": "9060", "description": "Modelo moderno New Balance", "brand": "New Balance"},
            {"name": "574", "description": "Icónico modelo New Balance", "brand": "New Balance"},
            {"name": "1300", "description": "Clásico New Balance", "brand": "New Balance"},
            {"name": "530", "description": "Retro New Balance", "brand": "New Balance"},
            # Reebok (4 estilos)
            {"name": "Princesa", "description": "Línea Princesa de Reebok", "brand": "Reebok"},
            {"name": "Plus Clásico", "description": "Plus Clásico Reebok", "brand": "Reebok"},
            {"name": "Bota Clásica", "description": "Bota Clásica Reebok", "brand": "Reebok"},
            {"name": "Running", "description": "Línea Running de Reebok", "brand": "Reebok"},
        ]
        
        styles = {}
        for style_data in styles_data:
            style = Style(
                id=uuid.uuid4(),
                name_style=style_data["name"],
                description_style=style_data["description"],
                brand_id=brands[style_data["brand"]].id,
            )
            db.add(style)
            styles[style_data["name"]] = style
        
        db.flush()  # Asegurar que los IDs se generen
        
        # ── 5. Insertar 65 PRODUCTS ─────────────────────────────────────
        # Regla especial: Reebok Princesa SOLO en Dama + Infantil (NO Caballero)
        
        products_data = [
            # Nike: 6 estilos × 3 categorías = 18 productos
            {"style": "Air Force One", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "SB", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Force One Bota", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Air Jordan 1", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Air Jordan 11", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Air Max", "categories": ["Dama", "Caballero", "Infantil"]},
            # Adidas: 7 estilos × 3 categorías = 21 productos
            {"style": "Superstar", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Forum", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Ultraboost", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Stan Smith", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Campus", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Varial", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Neo", "categories": ["Dama", "Caballero", "Infantil"]},
            # Puma: 1 estilo × 3 categorías = 3 productos
            {"style": "California", "categories": ["Dama", "Caballero", "Infantil"]},
            # New Balance: 4 estilos × 3 categorías = 12 productos
            {"style": "9060", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "574", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "1300", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "530", "categories": ["Dama", "Caballero", "Infantil"]},
            # Reebok: Princesa (Dama + Infantil) + 3 estilos × 3 = 11 productos
            {"style": "Princesa", "categories": ["Dama", "Infantil"]},  # ⚠️ SIN Caballero
            {"style": "Plus Clásico", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Bota Clásica", "categories": ["Dama", "Caballero", "Infantil"]},
            {"style": "Running", "categories": ["Dama", "Caballero", "Infantil"]},
        ]
        
        inserted_products = 0
        available_colors = ["Negro", "Blanco", "Azul", "Rojo", "Marrón", "Gris"]
        
        for product_mapping in products_data:
            style_obj = styles[product_mapping["style"]]
            for cat_name in product_mapping["categories"]:
                category_obj = categories[cat_name]
                product = Product(
                    id=uuid.uuid4(),
                    name_product=f"{product_mapping['style']} - {cat_name}",
                    style_id=style_obj.id,
                    category_id=category_obj.id,
                    brand_id=style_obj.brand_id,
                    color=random.choice(available_colors),
                    image_url=None, # Se pueden subir luego
                    insufficient_threshold=12,
                    state=True
                )
                db.add(product)
                inserted_products += 1
        
        db.commit()
        print(f"✅ Catálogo insertado exitosamente:")
        print(f"   • {len(brands)} brands ({', '.join([b['name'] for b in brands_data])})")
        print(f"   • {len(categories)} categorías ({', '.join([c['name'] for c in categories_data])})")
        print(f"   • {len(styles_data)} estilos")
        print(f"   • {inserted_products} productos")
        print("   ⚠️  Nota: Reebok Princesa solo en Dama + Infantil (sin Caballero)")
        
        # Generar inventario inicial aleatorio para que no todo esté en 0
        print("🔄 Generando inventario inicial aleatorio...")
        all_products = db.query(Product).all()
        for p in all_products:
            # Seleccionar algunas tallas aleatorias según categoría
            if p.category.name_category == "Infantil":
                sizes = ["21", "22", "23", "24", "25", "26"]
            else:
                sizes = ["36", "37", "38", "39", "40", "41", "42"]
                
            for size in random.sample(sizes, k=random.randint(2, len(sizes))):
                inv = Inventory(
                    id=uuid.uuid4(),
                    product_id=p.id,
                    size=size,
                    amount=random.randint(0, 50) # Algunos con stock, otros bajo
                )
                db.add(inv)
        
        db.commit()
        print("✅ Inventario inicial generado")
        return True
        
    except Exception as e:
        print(f"❌ Error en seed_catalog: {str(e)}")
        db.rollback()
        return False


def seed_all(db: Session) -> None:
    """
    Ejecuta todos los seeds de forma idempotente.
    Se ejecuta automáticamente en el startup del backend.
    """
    try:
        print("📦 Iniciando proceso de seed de datos...")

        success = True
        success = seed_roles(db) and success
        success = seed_type_documents(db) and success
        success = seed_admin(db) and success
        success = seed_users(db) and success
        success = seed_catalog(db) and success
        # seed_orders NO se ejecuta — no se insertan pedidos de prueba automáticamente

        if success:
            print("🎉 Todos los seeds completados exitosamente")
        else:
            print("⚠️  Algunos seeds no se completaron correctamente")

    except Exception as e:
        print(f"💥 Error fatal en seed: {str(e)}")
