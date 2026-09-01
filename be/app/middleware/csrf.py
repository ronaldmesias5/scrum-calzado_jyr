"""
Archivo: be/app/middleware/csrf.py
Descripción: Middleware de protección CSRF (Cross-Site Request Forgery).

¿Qué?
  Implementa el patrón Double-Submit Cookie para CSRF:
  1. Genera un token CSRF y lo envía como cookie HttpOnly
  2. El frontend lo lee y lo envía en el header X-CSRF-Token
  3. El middleware compara ambos valores en cada mutation (POST/PUT/PATCH/DELETE)
  
¿Para qué?
  - Proteger contra ataques CSRF donde un sitio malicioso puede hacer
    peticiones autenticadas en nombre del usuario
  - Complementar la protección SameSite=Lax de las cookies JWT
  - Cumplir con el requisito de seguridad del checklist

¿Impacto?
  BAJO — Solo valida headers en requests de mutación.
  Las peticiones GET pasan sin validación.
  Dependencias: secrets (stdlib), starlette (middleware base)
"""

import secrets
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


# Métodos HTTP que modifican estado (requieren CSRF protection)
STATE_CHANGING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Rutas exentas de CSRF (login, registro, refresh — aún no tienen sesión válida)
CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/request-reactivation",
    "/api/v1/auth/request-new-invitation",
    "/api/v1/catalog/",        # Catálogo público (solo lectura)
}

# Nombres de cookies y headers
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "x-csrf-token"


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    Middleware CSRF usando Double-Submit Cookie Pattern.
    
    Flujo:
    1. En cada respuesta, se genera/renueva un token CSRF en cookie
    2. El frontend lee la cookie y la envía en X-CSRF-Token header
    3. En requests de mutación, se verifica que coincidan
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[JSONResponse]]
    ) -> JSONResponse:
        path = request.url.path

        # ══════════════════════════════════════════════
        # PASO 1: Siempre enviar token CSRF en la respuesta
        # ══════════════════════════════════════════════
        response = await call_next(request)

        # Generar nuevo token CSRF si no existe
        existing_token = request.cookies.get(CSRF_COOKIE_NAME)
        if not existing_token:
            token = secrets.token_hex(32)  # 64 caracteres hex
        else:
            token = existing_token

        # Establecer cookie CSRF (HttpOnly=false para que JS pueda leerla)
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=token,
            max_age=3600,          # 1 hora
            httponly=False,         # Frontend necesita leerla
            samesite="strict",      # No se envía en cross-origin
            secure=False,           # TODO: True en producción con HTTPS
            path="/",
        )

        # ══════════════════════════════════════════════
        # PASO 2: Validar CSRF en mutaciones
        # ══════════════════════════════════════════════
        if request.method in STATE_CHANGING_METHODS:
            # Rutas exentas (login, registro, etc.)
            is_exempt = any(path.startswith(exempt) for exempt in CSRF_EXEMPT_PATHS)

            if not is_exempt:
                # Obtener token del header
                header_token = request.headers.get(CSRF_HEADER_NAME)

                if not header_token:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Token CSRF faltante. Incluye el header X-CSRF-Token."},
                    )

                # Comparar tokens de forma segura (timing-safe)
                if not secrets.compare_digest(header_token, token):
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Token CSRF inválido. Posible ataque CSRF detectado."},
                    )

        return response
