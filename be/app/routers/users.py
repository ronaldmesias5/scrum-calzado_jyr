"""
Archivo: be/app/routers/users.py
Descripción: Router FastAPI con endpoints para gestión del perfil del usuario autenticado.

¿Qué?
  Define endpoints protegidos:
  - GET /me: Obtener perfil completo del usuario autenticado
  - POST /me/avatar: Subir o actualizar foto de perfil
  - DELETE /me/avatar: Eliminar foto de perfil
  
¿Para qué?
  - Permitir al usuario consultar y editar sus propios datos
  - Proveer información para header del dashboard (nombre, avatar)
  - Subir/eliminar avatar (foto de perfil)
  
¿Impacto?
  MEDIO — Dashboard AdminHeader depende de /me para mostrar nombre/avatar.
  Dependencias: dependencies.py (get_current_user),
               auth/schemas.py (UserResponse), models/user.py
"""

import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"],
)

UPLOADS_DIR = Path(settings.UPLOAD_DIR) if settings.UPLOAD_DIR else Path(__file__).resolve().parent.parent.parent / "uploads"


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener perfil del usuario autenticado",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Retorna los datos del usuario autenticado."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name_user,
        last_name=current_user.last_name,
        phone=current_user.phone,
        identity_document=current_user.identity_document,
        identity_document_type_id=current_user.identity_document_type_id,
        identity_document_type_name=current_user.identity_document_type.name_type_document if current_user.identity_document_type else None,
        is_active=current_user.is_active,
        is_validated=current_user.is_validated,
        must_change_password=current_user.must_change_password,
        role_name=current_user.role.name_role if current_user.role else None,
        business_name=current_user.business_name,
        occupation=current_user.occupation,
        avatar_url=current_user.avatar_url,
        accepted_terms=current_user.accepted_terms,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.post(
    "/me/avatar",
    summary="Subir o actualizar foto de perfil",
    response_model=dict,
)
async def upload_avatar(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sube y guarda la foto de perfil del usuario autenticado."""
    # Validar tipo de archivo por MIME real (independiente del nombre del archivo)
    # y derivar la extensión segura. Bloquea SVG/HTML/ejecutables disfrazados.
    ALLOWED_MIME = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/avif": ".avif",
        "image/bmp": ".bmp",
        "image/heic": ".heic",
        "image/heif": ".heif",
        "image/tiff": ".tiff",
    }
    ext = ALLOWED_MIME.get((image.content_type or "").lower())
    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagen no permitido. Usa JPG, PNG, WEBP, GIF, AVIF, BMP, HEIC o TIFF",
        )

    # Validar tamaño (máximo 5 MB)
    content = await image.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

    # Crear directorio si no existe
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # Eliminar avatar anterior si existe
    if current_user.avatar_url and current_user.avatar_url.startswith("/uploads/"):
        old_filename = current_user.avatar_url.split("/uploads/")[-1].split("?")[0]
        old_path = UPLOADS_DIR / old_filename
        if old_path.exists():
            old_path.unlink()

    # Guardar nuevo archivo
    user_id_str = str(current_user.id)
    filename = f"avatar_{user_id_str}{ext}"
    file_path = UPLOADS_DIR / filename
    file_path.write_bytes(content)

    # Actualizar avatar_url en BD con versión para refrescar caché
    current_user.avatar_url = f"/uploads/{filename}?v={int(time.time())}"
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    return {"avatar_url": current_user.avatar_url, "message": "Foto de perfil actualizada exitosamente"}


@router.delete(
    "/me/avatar",
    summary="Eliminar foto de perfil",
    response_model=dict,
)
def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina la foto de perfil del usuario autenticado."""
    if current_user.avatar_url and current_user.avatar_url.startswith("/uploads/"):
        old_filename = current_user.avatar_url.split("/uploads/")[-1].split("?")[0]
        old_path = UPLOADS_DIR / old_filename
        if old_path.exists():
            old_path.unlink()

    current_user.avatar_url = None
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    return {"avatar_url": None, "message": "Foto de perfil eliminada exitosamente"}

