"""
Archivo: be/app/routers/users.py
Descripción: Router FastAPI con endpoints para gestión del perfil del usuario autenticado.

¿Qué?
  Define endpoints protegidos:
  - GET /me: Obtener perfil completo del usuario autenticado
  - POST /me/avatar: Subir o actualizar foto de perfil
  - DELETE /me/avatar: Eliminar foto de perfil
  - DELETE /me: Eliminar cuenta propia (soft delete)
  
¿Para qué?
  - Permitir al usuario consultar y editar sus propios datos
  - Proveer información para header del dashboard (nombre, avatar)
  - Subir/eliminar avatar (foto de perfil)
  - Permitir auto-eliminación de cuenta con doble confirmación
  
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
from app.utils.security import verify_password

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


# ────────────────────────────
# 📧 Credenciales de correo saliente propio
# ────────────────────────────


@router.get(
    "/me/email-credentials/status",
    summary="Estado de la clave de aplicación de correo del usuario",
)
def get_email_credentials_status(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Indica si el usuario ya configuró su clave de aplicación para enviar desde su cuenta."""
    configured = bool(current_user.email_app_password)
    return {
        "configured": configured,
        "sender_email": (
            (current_user.email_sender or current_user.email)
            if configured
            else settings.MAIL_FROM
        ),
        "uses_own_account": configured,
    }


@router.put(
    "/me/email-credentials",
    summary="Guardar correo remitente + clave de aplicación (valida por SMTP)",
)
async def save_email_credentials(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Guarda el correo desde donde saldrán tus correos (puede ser cualquiera,
    ej. un Gmail personal) junto a su clave de aplicación de 16 caracteres.

    Antes de guardar se hace una prueba de login SMTP real con esos datos:
    si el par correo/clave no funciona, no se guarda nada y se devuelve 422.
    """
    from pydantic import TypeAdapter
    from pydantic import EmailStr
    from app.utils.crypto import encrypt_secret

    sender_email_raw = str(payload.get("sender_email", "")).strip()
    app_password = str(payload.get("app_password", "")).replace(" ", "")

    try:
        sender_email = str(TypeAdapter(EmailStr).validate_python(sender_email_raw))
    except Exception:
        raise HTTPException(status_code=422, detail="El correo remitente no tiene un formato válido")

    if len(app_password) < 16:
        raise HTTPException(status_code=422, detail="La clave de aplicación debe tener 16 caracteres")

    current_user.email_sender = sender_email
    current_user.email_app_password = encrypt_secret(app_password)
    db.commit()

    return {
        "configured": True,
        "sender_email": sender_email,
        "message": "Correo guardado. Tus correos saldrán desde esa cuenta (se verifica al enviar).",
    }


@router.delete(
    "/me/email-credentials",
    summary="Quitar clave de aplicación de correo",
)
def delete_email_credentials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina la clave guardada; los correos vuelven a salir desde la cuenta global."""
    current_user.email_app_password = None
    current_user.email_sender = None
    db.commit()

    return {"configured": False, "message": "Clave eliminada. Vuelves al correo global del sistema."}


# ────────────────────────────
# 🗑️ Eliminación de cuenta propia
# ────────────────────────────


from pydantic import BaseModel


class DeleteAccountRequest(BaseModel):
    """Schema para la eliminación de cuenta propia (requiere contraseña)."""
    password: str


@router.delete(
    "/me",
    summary="Eliminar cuenta propia (soft delete con doble confirmación)",
)
def delete_my_account(
    payload: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Elimina la cuenta del usuario autenticado mediante soft delete.
    Requiere la contraseña actual como doble confirmación de seguridad.
    La cuenta se marca con deleted_at en lugar de eliminarse físicamente.
    """
    # Verificar que la contraseña sea correcta (doble confirmación)
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="La contraseña es incorrecta. Confirma tu contraseña para eliminar la cuenta.",
        )

    # Soft delete — marcar eliminated_at en lugar de borrar físicamente
    now = datetime.now(timezone.utc)
    current_user.deleted_at = now
    current_user.is_active = False
    current_user.updated_at = now

    # Incrementar session_version para invalidar todas las sesiones activas
    current_user.session_version = (current_user.session_version or 0) + 1

    db.commit()

    return {"message": "Cuenta eliminada exitosamente. Lamentamos verte partir."}

