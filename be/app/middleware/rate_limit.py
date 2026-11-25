# ════════════════════════════════════════
# 📄 Rate limiting en memoria por cliente
# ════════════════════════════════════════

import os
import time
from collections import defaultdict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

_MAX_TRACKED_KEYS = 10_000
_STALE_KEY_SECONDS = 3600


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiter simple en memoria (para producción usar Redis)."""

    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)  # {(regla, ip): [timestamp, ...]}
        self.last_seen: dict[tuple[str, str], float] = {}
        env = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
        self.is_disabled = env in ("dev", "development", "test", "testing")
        self.is_staging = env in ("staging", "qa")
        self.is_production = env in ("prod", "production")

        # Multiplicador: staging tiene límites 10x más altos que producción
        self.multiplier = 10 if self.is_staging else 1

        # Reglas: {path: (max_requests, time_window_seconds)}
        self.limits = {
            "/api/v1/auth/login": (10, 900) if self.is_production else (500, 900),
            "/api/v1/auth/register": (10, 3600) if self.is_production else (200, 3600),
            "/api/v1/auth/forgot-password": (10, 3600) if self.is_production else (200, 3600),
            "/api/v1/auth/reset-password": (10, 1800) if self.is_production else (200, 1800),
            "/api/v1/auth/resend-verification": (5, 3600) if self.is_production else (100, 3600),
            "/api/v1/auth/refresh": (60, 60) if self.is_production else (600, 60),
        }

    @staticmethod
    def _client_ip(request: Request) -> str:
        """IP real del cliente, respetando proxies (X-Forwarded-For) cuando existan."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            first = forwarded.split(",")[0].strip()
            if first:
                return first
        return request.client.host if request.client else "unknown"

    def _purge_stale_keys(self, now: float) -> None:
        """Evita que el diccionario crezca sin límite con IPs ya inactivas."""
        if len(self.requests) <= _MAX_TRACKED_KEYS:
            return
        stale = [key for key, seen in self.last_seen.items() if now - seen > _STALE_KEY_SECONDS]
        for key in stale:
            self.requests.pop(key, None)
            self.last_seen.pop(key, None)

    async def dispatch(self, request: Request, call_next) -> JSONResponse:
        # Solo deshabilitar en desarrollo local y tests
        if self.is_disabled:
            response = await call_next(request)
            return response

        client_ip = self._client_ip(request)
        path = request.url.path
        current_time = time.time()

        # Determinar límite aplicable
        max_requests = 100 * self.multiplier
        time_window = 60
        matched_rule = "global"

        for limit_path, (limit_count, limit_seconds) in self.limits.items():
            if path.startswith(limit_path):
                max_requests = limit_count * self.multiplier
                time_window = limit_seconds
                matched_rule = limit_path
                break

        # Clave (regla, IP): sin ella, requests a otros endpoints consumen la
        # cuota de login/registro porque la lista estaba compartida por IP.
        client_key = (matched_rule, client_ip)

        self._purge_stale_keys(current_time)

        # Limpiar requests antiguos de esta clave
        timestamps = self.requests[client_key]
        timestamps[:] = [ts for ts in timestamps if current_time - ts < time_window]
        self.last_seen[client_key] = current_time

        # Verificar límite
        if len(timestamps) >= max_requests:
            retry_after = max(1, int(timestamps[0] + time_window - current_time))
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Demasiadas solicitudes. Intenta más tarde.",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "RateLimit-Limit": str(max_requests),
                    "RateLimit-Remaining": "0",
                    "RateLimit-Reset": str(retry_after),
                },
            )

        # Registrar request
        timestamps.append(current_time)

        response = await call_next(request)
        reset_in = max(0, int(timestamps[0] + time_window - current_time))
        response.headers["RateLimit-Limit"] = str(max_requests)
        response.headers["RateLimit-Remaining"] = str(max(0, max_requests - len(timestamps)))
        response.headers["RateLimit-Reset"] = str(reset_in)

        return response
