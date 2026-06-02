"""
Archivo: be/app/utils/email.py
Descripción: Utilidades para envío de emails (bienvenida y recuperación de contraseña).

¿Qué?
  - _send_email(): función genérica de envío SMTP con aiosmtplib
  - send_password_reset_email(): email con enlace de reset
  - send_welcome_email(): email con credenciales temporales
  - Modo DEV (ENVIRONMENT=development): imprime en consola
  - Modo PROD (ENVIRONMENT=production): envía por SMTP real

Dependencias: config.py (MAIL_*, FRONTEND_URL, ENVIRONMENT),
             aiosmtplib (pyproject.toml)
"""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import base64

from app.core.config import settings

logger = logging.getLogger("app")


def _build_mail_message(
    to_email: str,
    subject: str,
    html_body: str,
) -> MIMEMultipart:
    """Construye un mensaje MIME multipart con contenido HTML."""
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    return msg


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Envía un email vía SMTP. Siempre imprime un resumen en consola."""
    print("=" * 60)
    print(f"📧 Email a: {to_email}")
    print(f"   Asunto: {subject}")
    print("=" * 60)

    try:
        from aiosmtplib import SMTP

        message = _build_mail_message(to_email, subject, html_body)

        kwargs: dict = {
            "hostname": settings.MAIL_SERVER,
            "port": settings.MAIL_PORT,
            "use_tls": settings.MAIL_PORT == 465,
            "start_tls": settings.MAIL_PORT == 587,
        }
        if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
            kwargs["username"] = settings.MAIL_USERNAME
            kwargs["password"] = settings.MAIL_PASSWORD

        async with SMTP(**kwargs) as smtp:
            await smtp.send_message(message)

        logger.info(f"Email enviado a {to_email} (asunto: {subject})")

    except Exception as exc:
        logger.error(f"Error al enviar email a {to_email}: {exc}")


# ══════════════════════════════════════════
# Emails específicos
# ══════════════════════════════════════════

PASSWORD_RESET_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#1e3a5f;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Recuperación de contraseña</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola,</p>
      <p style="font-size:15px;color:#333">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{reset_url}" style="background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Restablecer contraseña</a>
      </div>
      <p style="font-size:13px;color:#777">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""

WELCOME_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#1e3a5f;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Bienvenido al sistema</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{name}</strong>,</p>
      <p style="font-size:15px;color:#333">Se ha creado una cuenta para ti en el sistema de <strong>Calzado J&R</strong>. Estas son tus credenciales de acceso:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#64748b;padding:4px 0">Usuario:</td><td style="font-weight:bold;color:#1e293b">{email}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Contraseña temporal:</td><td style="font-weight:bold;font-family:monospace;color:#2563eb;font-size:16px">{temp_password}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{login_url}" style="background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Iniciar sesión</a>
      </div>
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px;margin:20px 0">
        <p style="font-size:13px;color:#92400e;margin:0">⚠️ <strong>Importante:</strong> Deberás cambiar tu contraseña al iniciar sesión por primera vez.</p>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""


async def send_password_reset_email(email: str, token: str) -> None:
    """Envía un email de recuperación de contraseña con enlace de reset."""
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
    html = PASSWORD_RESET_HTML.format(reset_url=reset_url)

    await _send_email(
        to_email=email,
        subject="CALZADO J&R — Recuperación de contraseña",
        html_body=html,
    )


async def send_welcome_email(email: str, temp_password: str, name: str) -> None:
    """Envía un email de bienvenida con credenciales temporales de acceso."""
    login_url = f"{settings.FRONTEND_URL}/auth/login"
    html = WELCOME_HTML.format(
        name=name,
        email=email,
        temp_password=temp_password,
        login_url=login_url,
    )

    await _send_email(
        to_email=email,
        subject="CALZADO J&R — Credenciales de acceso",
        html_body=html,
    )


REPORT_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#1e3a5f;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Reporte del sistema</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{to_name}</strong>,</p>
      <p style="font-size:15px;color:#333">{body_html}</p>
      <p style="font-size:13px;color:#777">El archivo PDF se adjunta en este correo.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""


def _build_mail_message_with_attachment(
    to_email: str,
    subject: str,
    html_body: str,
    pdf_bytes: bytes,
    pdf_filename: str,
) -> MIMEMultipart:
    """Construye un mensaje MIME con contenido HTML y un PDF adjunto."""
    msg = MIMEMultipart("mixed")
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject

    alternative = MIMEMultipart("alternative")
    alternative.attach(MIMEText(html_body, "html", "utf-8"))
    msg.attach(alternative)

    attachment = MIMEApplication(pdf_bytes, _subtype="pdf")
    attachment.add_header(
        "Content-Disposition",
        "attachment",
        filename=pdf_filename,
    )
    msg.attach(attachment)

    return msg


async def send_report_email(
    to_email: str,
    to_name: str,
    subject: str,
    body_html: str,
    pdf_base64: str,
    pdf_filename: str,
) -> None:
    """Envía un email con un PDF adjunto usando base64."""
    html = REPORT_HTML_TEMPLATE.format(to_name=to_name, body_html=body_html)
    pdf_bytes = base64.b64decode(pdf_base64)

    print("=" * 60)
    print(f"📧 Reporte a: {to_email}")
    print(f"   Asunto: {subject}")
    print(f"   Archivo: {pdf_filename}")
    print("=" * 60)

    try:
        from aiosmtplib import SMTP

        message = _build_mail_message_with_attachment(to_email, subject, html, pdf_bytes, pdf_filename)

        kwargs: dict = {
            "hostname": settings.MAIL_SERVER,
            "port": settings.MAIL_PORT,
            "use_tls": settings.MAIL_PORT == 465,
            "start_tls": settings.MAIL_PORT == 587,
        }
        if settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
            kwargs["username"] = settings.MAIL_USERNAME
            kwargs["password"] = settings.MAIL_PASSWORD

        async with SMTP(**kwargs) as smtp:
            await smtp.send_message(message)

        logger.info(f"Reporte enviado a {to_email} (asunto: {subject})")

    except Exception as exc:
        logger.error(f"Error al enviar reporte a {to_email}: {exc}")
