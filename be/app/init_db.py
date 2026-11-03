# ════════════════════════════════════════
# 📄 Inicialización automática de BD con migraciones Alembic
# ════════════════════════════════════════

import logging
import os
from alembic.config import Config
from alembic.command import upgrade as alembic_upgrade
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def run_migrations(db_url: str, raise_on_error: bool = False) -> bool:
    """Ejecuta todas las migraciones pendientes de Alembic."""
    try:
        logger.info("🔄 Ejecutando migraciones Alembic...")
        
        # Alembic está en /app/alembic dentro del contenedor
        # y en be/alembic en desarrollo local
        # Nota: alembic.ini está en el directorio PADRE de alembic/ (be/ o /app/)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)  # be/
        parent_root = os.path.dirname(project_root)  # scrum/
        
        # Intentar encontrar alembic.ini en diferentes ubicaciones
        # (alembic.ini está en el mismo nivel que la carpeta alembic/, no DENTRO)
        possible_alembic_ini_paths = [
            os.path.join(project_root, "alembic.ini"),  # be/alembic.ini (local)
            "/app/alembic.ini",                           # /app/alembic.ini (Docker)
            os.path.join(parent_root, "alembic.ini"),    # scrum/alembic.ini (alternativo)
        ]
        
        alembic_ini = None
        for path in possible_alembic_ini_paths:
            if os.path.exists(path):
                alembic_ini = path
                break
        
        if not alembic_ini:
            logger.warning(f"⚠️  alembic.ini no encontrado en: {possible_alembic_ini_paths}")
            return False
        
        logger.info(f"📍 Usando alembic.ini desde: {alembic_ini}")
        
        # Configurar Alembic
        alembic_config = Config(alembic_ini)
        alembic_config.set_main_option("sqlalchemy.url", db_url)
        
        # Ejecutar upgrade a 'head' (última migración)
        alembic_upgrade(alembic_config, "head")
        
        logger.info("✅ Migraciones completadas exitosamente")
        return True
        
    except Exception as e:
        logger.warning(f"⚠️  Error ejecutando migraciones: {str(e)}")
        if raise_on_error:
            raise
        # No lanzar excepción para permitir que el servidor continúe
        return False


def verify_initial_data(db: Session) -> None:
    """Verifica que los datos iniciales existan."""
    try:
        logger.info("🔍 Verificando datos iniciales...")
        
        # Verificar que existan tipos de documentos
        try:
            from app.models.type_document import TypeDocument
            type_doc_count = db.query(TypeDocument).count()
            if type_doc_count == 0:
                logger.warning("⚠️  No hay tipos de documentos.")
            else:
                logger.info(f"✅ {type_doc_count} tipos de documentos encontrados")
        except Exception as e:
            logger.warning(f"⚠️  No se pudo verificar type_document: {str(e)}")
        
        # Verificar que existan roles
        try:
            from app.models.role import Role
            roles_count = db.query(Role).count()
            if roles_count == 0:
                logger.warning("⚠️  No hay roles.")
            else:
                logger.info(f"✅ {roles_count} roles encontrados")
        except Exception as e:
            logger.warning(f"⚠️  No se pudo verificar roles: {str(e)}")
        
    except Exception as e:
        logger.warning(f"⚠️  Error verificando datos iniciales: {str(e)}")


def initialize_database(db_url: str, db: Session) -> None:
    """Inicializa completamente la base de datos en el startup."""
    try:
        logger.info("📦 Inicializando base de datos...")
        
        # 1. Ejecutar migraciones
        run_migrations(db_url)
        
        # 2. Verificar datos iniciales
        verify_initial_data(db)
        
        logger.info("🎉 Base de datos inicializada correctamente")
        
    except Exception as e:
        logger.error(f"💥 Error inicializando la base de datos: {str(e)}")
