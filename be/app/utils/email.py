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


ACCOUNT_APPROVED_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#1e3a5f;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Registro exitoso</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{name}</strong>,</p>
      <p style="font-size:15px;color:#333">Tu registro en el sistema de <strong>Calzado J&R</strong> se ha completado <strong style="color:#16a34a">exitosamente</strong>.</p>
      <p style="font-size:15px;color:#333">Ya puedes iniciar sesión y comenzar a realizar pedidos.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{login_url}" style="background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Iniciar sesión</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""

ACCOUNT_REJECTED_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#1e3a5f;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Cuenta rechazada</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{name}</strong>,</p>
      <p style="font-size:15px;color:#333">Lamentamos informarte que tu solicitud de registro en <strong>Calzado J&R</strong> ha sido <strong style="color:#dc2626">rechazada</strong>.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="font-size:14px;color:#991b1b;margin:0"><strong>Motivo:</strong></p>
        <p style="font-size:14px;color:#991b1b;margin:8px 0 0">{reason}</p>
      </div>
      <p style="font-size:13px;color:#777">Si crees que se trata de un error, por favor contáctanos para más información.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""

async def send_account_approved_email(email: str, name: str) -> None:
    """Envía un email de notificación al usuario cuando su cuenta es aprobada."""
    login_url = f"{settings.FRONTEND_URL}/auth/login"
    html = ACCOUNT_APPROVED_HTML.format(name=name, login_url=login_url)

    await _send_email(
        to_email=email,
        subject="CALZADO J&R — ¡Registro exitoso!",
        html_body=html,
    )


async def send_account_rejected_email(email: str, name: str, reason: str) -> None:
    """Envía un email de notificación al usuario cuando su cuenta es rechazada."""
    html = ACCOUNT_REJECTED_HTML.format(name=name, reason=reason)

    await _send_email(
        to_email=email,
        subject="CALZADO J&R — Tu solicitud de registro ha sido rechazada",
        html_body=html,
    )


REACTIVATION_APPROVED_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#1e3a5f;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Cuenta reactivada</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{name}</strong>,</p>
      <p style="font-size:15px;color:#333">Tu solicitud de reactivación de cuenta en <strong>Calzado J&R</strong> ha sido <strong style="color:#16a34a">aprobada</strong>.</p>
      <p style="font-size:15px;color:#333">Tu cuenta ha sido reactivada. Ya puedes iniciar sesión con tus credenciales.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{login_url}" style="background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Iniciar sesión</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""

REACTIVATION_REJECTED_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#1e3a5f;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Solicitud de reactivación</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{name}</strong>,</p>
      <p style="font-size:15px;color:#333">Lamentamos informarte que tu solicitud de reactivación de cuenta en <strong>Calzado J&R</strong> ha sido <strong style="color:#dc2626">rechazada</strong>.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="font-size:14px;color:#991b1b;margin:0"><strong>Motivo:</strong></p>
        <p style="font-size:14px;color:#991b1b;margin:8px 0 0">{reason}</p>
      </div>
      <p style="font-size:13px;color:#777">Si crees que se trata de un error, por favor contáctanos para más información.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""


async def send_reactivation_approved_email(email: str, name: str) -> None:
    """Envía un email notificando que la solicitud de reactivación fue aprobada."""
    login_url = f"{settings.FRONTEND_URL}/auth/login"
    html = REACTIVATION_APPROVED_HTML.format(name=name, login_url=login_url)
    await _send_email(
        to_email=email,
        subject="CALZADO J&R — Tu cuenta ha sido reactivada",
        html_body=html,
    )


async def send_reactivation_rejected_email(email: str, name: str, reason: str) -> None:
    """Envía un email notificando que la solicitud de reactivación fue rechazada."""
    html = REACTIVATION_REJECTED_HTML.format(name=name, reason=reason)
    await _send_email(
        to_email=email,
        subject="CALZADO J&R — Solicitud de reactivación rechazada",
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


# ══════════════════════════════════════════
# Emails de notificación de pedidos
# ══════════════════════════════════════════

ORDER_NOTIFICATION_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#2563eb;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Nuevo Pedido Recibido</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{jefe_name}</strong>,</p>
      <p style="font-size:15px;color:#333">Se ha registrado un nuevo pedido en el sistema:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#64748b;padding:4px 0">Pedido #:</td><td style="font-weight:bold;color:#1e293b">{order_id}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Cliente:</td><td style="font-weight:bold;color:#1e293b">{client_name}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Total pares:</td><td style="font-weight:bold;color:#1e293b">{total_pairs}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Fecha:</td><td style="font-weight:bold;color:#1e293b">{order_date}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="{order_url}" style="background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Ver Pedido</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""

ORDER_CONFIRMATION_HTML = """\
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#16a34a;padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">CALZADO J&R</h1>
      <p style="color:#bbf7d0;margin:4px 0 0;font-size:13px">Pedido Confirmado</p>
    </div>
    <div style="padding:32px 24px">
      <p style="font-size:15px;color:#333">Hola <strong>{client_name}</strong>,</p>
      <p style="font-size:15px;color:#333">Tu pedido ha sido registrado exitosamente en <strong>Calzado J&R</strong>:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;font-size:14px">
          <tr><td style="color:#64748b;padding:4px 0">Pedido #:</td><td style="font-weight:bold;color:#1e293b">{order_id}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Total pares:</td><td style="font-weight:bold;color:#1e293b">{total_pairs}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Fecha estimada:</td><td style="font-weight:bold;color:#1e293b">{delivery_date}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0">Estado:</td><td style="font-weight:bold;color:#16a34a">Pendiente</td></tr>
        </table>
      </div>
      <p style="font-size:15px;color:#333">Te notificaremos cuando tu pedido avance en producción.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="{login_url}" style="background:#16a34a;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">Ver mis pedidos</a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#999">Calzado J&R — Sistema de gestión de fábrica de calzado</p>
    </div>
  </div>
</body>
</html>"""


async def send_order_notification_email(
    jefe_email: str,
    jefe_name: str,
    order_id: str,
    client_name: str,
    total_pairs: int,
    order_date: str,
) -> None:
    """Envía email al jefe cuando un cliente crea un pedido."""
    order_url = f"{settings.FRONTEND_URL}/dashboard/admin/orders"
    html = ORDER_NOTIFICATION_HTML.format(
        jefe_name=jefe_name,
        order_id=order_id[:8],
        client_name=client_name,
        total_pairs=total_pairs,
        order_date=order_date,
        order_url=order_url,
    )
    await _send_email(
        to_email=jefe_email,
        subject=f"CALZADO J&R — Nuevo pedido de {client_name}",
        html_body=html,
    )


async def send_order_confirmation_email(
    client_email: str,
    client_name: str,
    order_id: str,
    total_pairs: int,
    delivery_date: str,
) -> None:
    """Envía email de confirmación al cliente cuando el jefe crea un pedido para él."""
    login_url = f"{settings.FRONTEND_URL}/auth/login"
    html = ORDER_CONFIRMATION_HTML.format(
        client_name=client_name,
        order_id=order_id[:8],
        total_pairs=total_pairs,
        delivery_date=delivery_date,
        login_url=login_url,
    )
    await _send_email(
        to_email=client_email,
        subject="CALZADO J&R — Tu pedido ha sido registrado",
        html_body=html,
    )
