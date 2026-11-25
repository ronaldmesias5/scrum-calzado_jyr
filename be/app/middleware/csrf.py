# ════════════════════════════════════════
# 📄 Middleware de protección CSRF (Cross-Site Request Forgery)
# ════════════════════════════════════════

import hashlib
import hmac
import secrets
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings


# Métodos HTTP que modifican estado (requieren CSRF protection)
STATE_CHANGING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Rutas exentas exactas (login, registro, refresh — aún no tienen sesión válida)
CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/request-reactivation",
    "/api/v1/auth/request-new-invitation",
    "/api/v1/ai/chat",
    "/api/v1/ai/health",
}

# Prefijos exentos (catálogo público de solo lectura y endpoints de IA públicos)
CSRF_EXEMPT_PREFIXES = (
    "/api/v1/catalog/",
    "/api/v1/ai/search/semantic",
    "/api/v1/ai/recommend",
)

# Nombres de cookies y headers
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "x-csrf-token"


def _sign_token(nonce: str) -> str:
    """Firma el nonce con HMAC-SHA256 para que el token no sea falsificable."""
    signature = hmac.new(
        settings.SECRET_KEY.encode(), nonce.encode(), hashlib.sha256
    ).hexdigest()
    return f"{nonce}.{signature}"


def _is_valid_token(token: str) -> bool:
    """Verifica que el token tenga una firma HMAC válida emitida por este backend."""
    nonce, separator, signature = token.partition(".")
    if not separator or not nonce or not signature:
        return False
    expected = hmac.new(
        settings.SECRET_KEY.encode(), nonce.encode(), hashlib.sha256
    ).hexdigest()
    return secrets.compare_digest(signature, expected)


def _issue_token() -> str:
    return _sign_token(secrets.token_hex(32))


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware CSRF usando Double-Submit Cookie Pattern con token firmado.

    Las peticiones autenticadas con `Authorization: Bearer` quedan exentas: el JWT
    viaja en un header explícito (no en cookies), por lo que no son vulnerables a
    CSRF. Esto permite que la app móvil consuma la API sin manejar cookies.
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[JSONResponse]]
    ) -> JSONResponse:
        path = request.url.path

        # Token vigente o uno nuevo firmado (se emite en toda respuesta)
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME) or ""
        if not _is_valid_token(cookie_token):
            cookie_token = _issue_token()

        # ══════════════════════════════════════════════
        # Validar CSRF antes de ejecutar la petición
        # ══════════════════════════════════════════════
        if request.method in STATE_CHANGING_METHODS:
            is_exempt = path in CSRF_EXEMPT_PATHS or path.startswith(
                CSRF_EXEMPT_PREFIXES
            )
            uses_bearer = (
                request.headers.get("authorization", "").strip().lower().startswith(
                    "bearer "
                )
            )

            if not is_exempt and not uses_bearer:
                header_token = request.headers.get(CSRF_HEADER_NAME)

                if not header_token:
                    return self._reject(
                        cookie_token,
                        "Token CSRF faltante. Incluye el header X-CSRF-Token.",
                    )

                # Comparación timing-safe contra la cookie + firma válida
                if not (
                    _is_valid_token(header_token)
                    and secrets.compare_digest(header_token, cookie_token)
                ):
                    return self._reject(
                        cookie_token,
                        "Token CSRF inválido. Posible ataque CSRF detectado.",
                    )

        response = await call_next(request)
        self._set_cookie(response, cookie_token)
        return response

    @staticmethod
    def _set_cookie(response, token: str) -> None:
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=token,
            max_age=3600,  # 1 hora
            httponly=False,  # Frontend necesita leerla
            samesite="strict",  # No se envía en cross-origin
            secure=settings.ENVIRONMENT == "production",
            path="/",
        )

    def _reject(self, token: str, detail: str) -> JSONResponse:
        """Rechaza la petición entregando igualmente el token que debe usarse."""
        response = JSONResponse(status_code=403, content={"detail": detail})
        self._set_cookie(response, token)
        return response
