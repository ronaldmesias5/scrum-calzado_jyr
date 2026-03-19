"""
Módulo: middleware/audit_logger.py
Descripción: Sistema de auditoría para OWASP #10 (Logging y Monitoreo).

Registra:
  - Login/Logout (quién, cuándo, desde dónde)
  - Cambios de contraseña
  - Acciones administrativas (crear/editar/eliminar usuarios, productos)
  - Intentos fallidos de autenticación
  - Acceso denegado (403)
  - Errores críticos (500)
"""

import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import Request, Response

# Usar loggers centralizados
from app.core.logging_config import audit_logger


class AuditLogger:
    """Logger centralizado para eventos de seguridad."""
    
    @staticmethod
    def log_auth_attempt(
        email: str,
        success: bool,
        client_ip: str,
        reason: Optional[str] = None
    ) -> None:
        """Registra intentos de autenticación."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "AUTH_ATTEMPT",
            "email": email,
            "success": success,
            "client_ip": client_ip,
            "reason": reason,
        }
        audit_logger.info(json.dumps(event))
    
    @staticmethod
    def log_password_change(
        user_id: str,
        email: str,
        client_ip: str,
        success: bool = True
    ) -> None:
        """Registra cambios de contraseña."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "PASSWORD_CHANGE",
            "user_id": str(user_id),
            "email": email,
            "client_ip": client_ip,
            "success": success,
        }
        audit_logger.info(json.dumps(event))
    
    @staticmethod
    def log_admin_action(
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str],
        details: dict,
        client_ip: str
    ) -> None:
        """Registra acciones administrativas."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "ADMIN_ACTION",
            "user_id": str(user_id),
            "action": action,  # CREATE, UPDATE, DELETE
            "resource_type": resource_type,  # USER, PRODUCT, ORDER, etc.
            "resource_id": str(resource_id) if resource_id else None,
            "details": details,
            "client_ip": client_ip,
        }
        audit_logger.info(json.dumps(event))
    
    @staticmethod
    def log_access_denied(
        user_id: Optional[str],
        endpoint: str,
        reason: str,
        client_ip: str
    ) -> None:
        """Registra acceso denegado."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "ACCESS_DENIED",
            "user_id": str(user_id) if user_id else None,
            "endpoint": endpoint,
            "reason": reason,
            "client_ip": client_ip,
        }
        audit_logger.warning(json.dumps(event))
    
    @staticmethod
    def log_error(
        endpoint: str,
        error_type: str,
        error_message: str,
        user_id: Optional[str],
        client_ip: str
    ) -> None:
        """Registra errores críticos."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "ERROR",
            "endpoint": endpoint,
            "error_type": error_type,
            "error_message": error_message,
            "user_id": str(user_id) if user_id else None,
            "client_ip": client_ip,
        }
        audit_logger.error(json.dumps(event))


class AuditMiddleware:
    """Middleware para registrar acciones HTTP."""
    
    @staticmethod
    async def log_audit(request: Request, response: Response) -> None:
        """Registra requests/responses importantes."""
        user_id = None
        
        # Intentar extraer user_id del token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # Aquí se podría decodificar el token si es necesario
            pass
        
        client_ip = request.client.host if request.client else "unknown"
        
        # Registrar endpoints críticos
        if request.method in ["POST", "PUT", "DELETE"]:
            event = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "REQUEST",
                "method": request.method,
                "endpoint": request.url.path,
                "status_code": response.status_code,
                "user_id": user_id,
                "client_ip": client_ip,
            }
            audit_logger.info(json.dumps(event))

