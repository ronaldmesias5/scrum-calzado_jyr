"""
Archivo: be/scripts/create_admin.py
Descripción: Script para crear usuario administrador inicial manualmente.

¿Qué?
  Script standalone que:
  - Verifica que role "admin" existe en BD
  - Crea usuario admin@calzadojyr.com con password Admin123!
  - Salta si admin ya existe (evita duplicados)
  - Marca is_active=True, is_validated=True, validated_at=now()
  
¿Para qué?
  - Inicializar sistema con primer admin (no se registra via frontend)
  - Permitir bootstrap de producción (ejecutar una vez en deploy)
  - Debug: Recrear admin si se borró accidentalmente
  
¿Impacto?
  MEDIO — Sin admin, sistema queda sin gestor (nadie valida cuentas).
  Password hardcoded Admin123! debe cambiarse después de primer login.
  Modificar email/password requiere: editar script + reejecutar.
  Dependencias: database.py (SessionLocal), models/user.py, models/role.py,
               utils/security.py (hash_password)

NOTA: En producción, considerar crear admin desde variables de entorno
      (no hardcodear password en script versionado).
      
Uso: 
  python scripts/create_admin.py
  O desde contenedor Docker:
  docker exec -it scrum-be-1 python scripts/create_admin.py
"""

import sys
import os

# Agregar el directorio padre al path para importar app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.utils.security import hash_password


def create_admin() -> None:
    """Crea el usuario administrador inicial."""
    db = SessionLocal()

    try:
        # Verificar que el rol admin existe
        stmt = select(Role).where(Role.name == "admin")
        admin_role = db.execute(stmt).scalar_one_or_none()

        if not admin_role:
            print("❌ Error: El rol 'admin' no existe en la base de datos.")
            print("   Asegúrate de que el script de inicialización se ejecutó correctamente.")
            return

        # Verificar si ya existe un admin
        stmt = select(User).where(User.role_id == admin_role.id)
        existing_admin = db.execute(stmt).scalar_one_or_none()

        if existing_admin:
            print(f"⚠️  Ya existe un administrador: {existing_admin.email}")
            print("   No se creó otro usuario.")
            return

        # Crear el admin
        admin_email = "admin@calzadojyr.com"
        admin_password = "Admin123!"

        admin_user = User(
            email=admin_email,
            full_name="Administrador J&R",
            hashed_password=hash_password(admin_password),
            role_id=admin_role.id,
            is_active=True,
            is_validated=True,
            validated_at=datetime.now(timezone.utc),
        )

        db.add(admin_user)
        db.commit()

        print("✅ Administrador creado exitosamente:")
        print(f"   Email: {admin_email}")
        print(f"   Contraseña: {admin_password}")
        print("   ⚠️  CAMBIA ESTA CONTRASEÑA después del primer login.")

    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
