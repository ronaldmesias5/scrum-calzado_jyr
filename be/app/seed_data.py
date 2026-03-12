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
from sqlalchemy.orm import Session
from app.models.role import Role
from app.models.type_document import TypeDocument

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
            logger.info(f"✅ Roles ya existen ({db.query(Role).count()} encontrados)")
            return True
        
        logger.info("🔄 Insertando roles iniciales...")
        
        roles = [
            Role(
                id=uuid.UUID("10000000-0000-0000-0000-000000000001"),
                name="admin",
                description="Administrador del sistema"
            ),
            Role(
                id=uuid.UUID("20000000-0000-0000-0000-000000000001"),
                name="employee",
                description="Empleado de la fábrica"
            ),
            Role(
                id=uuid.UUID("30000000-0000-0000-0000-000000000001"),
                name="client",
                description="Cliente — gestión de pedidos"
            ),
        ]
        
        for role in roles:
            db.merge(role)  # USE MERGE para evitar duplicados
        
        db.commit()
        logger.info("✅ Roles insertados exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error insertando roles: {str(e)}")
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
            logger.info(f"✅ Tipos de documentos ya existen ({db.query(TypeDocument).count()} encontrados)")
            return True
        
        logger.info("🔄 Insertando tipos de documentos...")
        
        type_docs = [
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                name="Cédula de Ciudadanía (CC)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
                name="Tarjeta de Identidad (TI)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000003"),
                name="Pasaporte"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000004"),
                name="Cédula de Extranjería (CE)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000005"),
                name="Permiso por Protección Temporal (PPT)"
            ),
            TypeDocument(
                id=uuid.UUID("00000000-0000-0000-0000-000000000006"),
                name="Documento de Identificación Personal (DIPS)"
            ),
        ]
        
        for doc_type in type_docs:
            db.merge(doc_type)  # USE MERGE para evitar duplicados
        
        db.commit()
        logger.info("✅ Tipos de documentos insertados exitosamente")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error insertando tipos de documentos: {str(e)}")
        db.rollback()
        return False


def seed_all(db: Session) -> None:
    """
    Ejecuta todos los seeds de forma idempotente.
    Se ejecuta automáticamente en el startup del backend.
    """
    try:
        logger.info("📦 Iniciando proceso de seed de datos...")
        
        success = True
        success = seed_roles(db) and success
        success = seed_type_documents(db) and success
        
        if success:
            logger.info("🎉 Todos los seeds completados exitosamente")
        else:
            logger.warning("⚠️  Algunos seeds no se completaron correctamente")
    
    except Exception as e:
        logger.error(f"💥 Error fatal en seed: {str(e)}")
