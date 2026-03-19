"""
Módulo: middleware/security_headers.py
Descripción: Middleware para agregar headers de seguridad OWASP.

Headers implementados:
  - X-Content-Type-Options: Previene MIME type sniffing (XSS)
  - X-Frame-Options: Previene clickjacking
  - X-XSS-Protection: XSS filter en navegadores antiguos
  - Strict-Transport-Security: HTTPS only (HSTS)
  - Content-Security-Policy: Controla recursos permitidos
  - Referrer-Policy: Control de información de referencia
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Agrega headers de seguridad a todas las respuestas."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Prevenir MIME type sniffing (XSS)
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevenir clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # XSS filter (navegadores antiguos)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # HTTPS only (comentar en desarrollo)
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # CSP - Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )
        
        return response
