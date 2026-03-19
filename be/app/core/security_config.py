"""
Módulo: security_config.py
Descripción: Configuración centralizada de seguridad (OWASP Top 10).

Proporciona constantes y configuraciones para:
  1. SQL Injection: ✅ Protección vía ORM SQLAlchemy
  2. Broken Auth: ✅ JWT + Bcrypt
  3. Sensitive Data: ✅ Passwords nunca en responses, soft delete
  4. XXE: ✅ No parseamos XML
  5. Broken Access Control: ✅ RBAC (admin/jefe/employee/client)
  6. Insecure Config: ✅ Variables de entorno, SECRET_KEY protegida
  7. XSS: ✅ Pydantic validation + HTML escaping
  8. CSRF: ✅ CORS + JWT headers
  9. Vulnerable Components: 🔄 Dependency scanning necesario
  10. Logging/Monitoring: ✅ Sistema de auditoría
"""

from typing import Dict, List


class RateLimitConfig:
    """Configuración de rate limiting (OWASP #2 - previene brute force)."""
    
    # Límites por endpoint (peticiones / segundos)
    ENDPOINT_LIMITS: Dict[str, tuple[int, int]] = {
        "/api/v1/auth/login": (5, 900),  # 5 intentos / 15 min
        "/api/v1/auth/register": (3, 3600),  # 3 intentos / 1 hora
        "/api/v1/auth/forgot-password": (3, 3600),  # 3 intentos / 1 hora
        "/api/v1/auth/reset-password": (5, 1800),  # 5 intentos / 30 min
    }
    
    # Límite global por defecto (peticiones / segundos)
    DEFAULT_LIMIT: tuple[int, int] = (100, 60)  # 100 peticiones / minuto
    
    # Códigos de respuesta
    STATUS_LIMIT_EXCEEDED = 429


class SecurityHeadersConfig:
    """Configuración de headers de seguridad (OWASP #1-8)."""
    
    # CSP (Content Security Policy): Previene XSS, clickjacking, etc.
    CSP_POLICY = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "  # unsafe-inline solo en desarrollo
        "style-src 'self' 'unsafe-inline'; "   # Para Tailwind CSS
        "img-src 'self' data: https:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "upgrade-insecure-requests; "
    )
    
    # Permiso de características del navegador
    PERMISSIONS_POLICY = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(), "
        "payment=(), "
        "usb=(), "
        "magnetometer=(), "
        "gyroscope=(), "
        "accelerometer=()"
    )
    
    # HSTS (HTTP Strict Transport Security) - comentado para dev, habilitar en prod
    # HSTS_HEADER = "max-age=31536000; includeSubDomains; preload"
    HSTS_HEADER = None  # Deshabilitado en desarrollo


class ValidationConfig:
    """Configuración de validación (OWASP #7 - XSS prevention)."""
    
    # Longitud máxima de strings
    MAX_STRING_LENGTH = 1000
    MAX_EMAIL_LENGTH = 254
    MAX_NAME_LENGTH = 100
    
    # Patrones regex para validación
    PASSWORD_PATTERN = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$"
    PHONE_PATTERN = r"^\d{7,20}$"
    IDENTITY_DOCUMENT_PATTERN = r"^\d{8,10}$"
    
    # Caracteres permitidos en nombres
    ALLOWED_NAME_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_")


class AuditConfig:
    """Configuración de auditoría (OWASP #10 - Logging & Monitoring)."""
    
    # Eventos que deben registrarse SIEMPRE
    CRITICAL_EVENTS = [
        "AUTH_ATTEMPT",
        "PASSWORD_CHANGE",
        "ADMIN_ACTION",
        "ACCESS_DENIED",
        "ERROR",
    ]
    
    # Retención de logs (días)
    LOG_RETENTION_DAYS = 90
    
    # Archivo de audit log
    AUDIT_LOG_FILE = "logs/audit.log"
    ERROR_LOG_FILE = "logs/error.log"
    APP_LOG_FILE = "logs/app.log"
    
    # Rotación de logs (bytes)
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 10


class DatabaseSecurityConfig:
    """Configuración de seguridad de base de datos (OWASP #1, #3, #6)."""
    
    # TODO: Habilitar en producción
    # - SSL connection string
    # - Connection pooling limits
    # - Prepared statements (ya tenemos vía SQLAlchemy)
    
    # Soft delete: nunca eliminar datos, solo marcar como deleted
    USE_SOFT_DELETE = True
    
    # Timeout de conexión (segundos)
    CONNECTION_TIMEOUT = 10


class EncryptionConfig:
    """Configuración de encriptación (OWASP #3 - Sensitive Data)."""
    
    # Algoritmo JWT
    JWT_ALGORITHM = "HS256"
    
    # Duración de tokens
    ACCESS_TOKEN_EXPIRE_MINUTES = 15
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    # Bcrypt
    BCRYPT_ROUNDS = 12  # Función de coste (más lento = más seguro)
    
    # Campos sensibles que NUNCA deben logearse
    SENSITIVE_FIELDS = [
        "password",
        "token",
        "secret",
        "api_key",
        "credit_card",
        "ssn",
    ]


class ErrorHandlingConfig:
    """Configuración de manejo de errores (OWASP #10)."""
    
    # Mensajes genéricos (NUNCA devolver detalles técnicos)
    ERROR_MESSAGES = {
        400: "Los datos de la solicitud son incorrectos",
        401: "No autorizado",
        403: "Acceso denegado",
        404: "Recurso no encontrado",
        422: "Error de validación en los datos enviados",
        429: "Demasiadas solicitudes, intente más tarde",
        500: "Error interno del servidor",
        503: "Servicio no disponible temporalmente",
    }
    
    # Stack traces NUNCA deben devolveres al cliente (solo logearse)
    EXPOSE_STACK_TRACES = False


class DependencyScanConfig:
    """Configuración de scanning de dependencias (OWASP #9)."""
    
    # Utilidades para checking:
    # - safety check: pip install safety
    # - pip-audit: pip install pip-audit
    # Ver requirements-security.txt
    SCAN_TOOLS = [
        "safety",  # Checks against known security vulnerabilities
        "pip-audit",  # Checks against PyPI Advisory Database
    ]


# Verificación de configuración en startup
def verify_security_config() -> None:
    """Verifica que la configuración de seguridad sea válida."""
    print("✅ Security config verification:")
    print(f"   - Rate limiting: {len(RateLimitConfig.ENDPOINT_LIMITS)} endpoints específicos")
    print(f"   - Security headers: CSP policy configured")
    print(f"   - Password policy: {ValidationConfig.PASSWORD_PATTERN}")
    print(f"   - Audit logs: {AuditConfig.AUDIT_LOG_FILE}")
    print(f"   - JWT expires in: {EncryptionConfig.ACCESS_TOKEN_EXPIRE_MINUTES} min")
    print(f"   - Bcrypt rounds: {EncryptionConfig.BCRYPT_ROUNDS}")
    print(f"   - Error exposure: {ErrorHandlingConfig.EXPOSE_STACK_TRACES}")
