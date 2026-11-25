# ════════════════════════════════════════
# 📄 Headers de seguridad OWASP en cada respuesta
# ════════════════════════════════════════

import os
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Agrega headers de seguridad a todas las respuestas.
    
    HSTS se activa SOLO en producción (requiere HTTPS).
    """
    
    def __init__(self, app):
        super().__init__(app)
        env = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
        self.is_production = env in ("prod", "production")
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Prevenir MIME type sniffing (XSS)
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevenir clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # XSS filter (navegadores antiguos)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # HSTS: SOLO en producción (requiere HTTPS)
        if self.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # CSP - Content Security Policy
        if self.is_production:
            # PRODUCCIÓN: CSP estricta
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' data:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )
        else:
            # DESARROLLO/STAGING: CSP permisiva para Swagger UI
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https:; "
                "font-src 'self' https://cdn.jsdelivr.net; "
                "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 "
                "ws://localhost:8000 ws://127.0.0.1:8000 "
                "http://localhost:8081 http://127.0.0.1:8081 "
                "ws://localhost:8081 ws://127.0.0.1:8081; "
                "frame-ancestors 'none';"
            )
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Aislamiento de origen cruzado (COOP/CORP/COEP)
        # COOP: evita que otras pestañas manipulen window.opener
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        # CORP: evita que otros sitios embeban nuestros recursos
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        # X-Permitted-Cross-Domain-Policies: deshabilita políticas cross-domain legadas
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=(), "
            "private-state-token-redemption=(), "
            "private-state-token-issuance=(), "
            "browsing-topics=(), "
            "run-ad-auction=(), "
            "join-ad-interest-group=()"
        )
        
        return response
