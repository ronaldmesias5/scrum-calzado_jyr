"""
Archivo: be/app/utils/email.py
Descripción: Utilidades para envío de emails de recuperación de contraseña.

¿Qué?
  Provee función send_password_reset_email() que:
  - En DESARROLLO: Imprime enlace de reset en consola del servidor
  - En PRODUCCIÓN (TODO): Enviaría email real con aiosmtplib/SMTP
  
¿Para qué?
  - Permitir flujo "Olvidé mi contraseña"
  - Enviar enlaces seguros con token de reset temporal
  - Facilitar desarrollo sin configurar servidor SMTP real
  
¿Impacto?
  MEDIO — Sin esta función, recuperación de contraseña no funciona.
  En desarrollo: Enlaces visibles en logs del servidor (docker-compose logs)
  En producción: Requiere configurar SMTP (MAIL_SERVER, MAIL_PORT, etc.)
  Modificar reset_url rompe: enlaces frontend (ResetPasswordPage).
  Dependencias: config.py (FRONTEND_URL, MAIL_* settings),
               auth/service.py (forgot_password), models/password_reset_token.py
"""

from app.core.config import settings


async def send_password_reset_email(email: str, token: str) -> None:
    """Envía un email de recuperación de contraseña.

    En desarrollo, imprime el enlace en la consola del servidor.
    En producción, se enviaría por SMTP real.
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    # En desarrollo, imprimir en consola en lugar de enviar email real
    print("=" * 60)
    print(f"📧 EMAIL DE RECUPERACIÓN DE CONTRASEÑA")
    print(f"   Para: {email}")
    print(f"   Enlace: {reset_url}")
    print("=" * 60)

    # TODO: Implementar envío real con aiosmtplib en producción
    # from aiosmtplib import send
    # message = MIMEText(f"Haz clic en el siguiente enlace: {reset_url}")
    # message["From"] = settings.MAIL_FROM
    # message["To"] = email
    # message["Subject"] = "CALZADO J&R — Recuperación de contraseña"
    # await send(message, hostname=settings.MAIL_SERVER, port=settings.MAIL_PORT)
