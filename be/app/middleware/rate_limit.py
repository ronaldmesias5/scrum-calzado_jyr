"""
Módulo: middleware/rate_limit.py
Descripción: Middleware para rate limiting (OWASP #2 - Autenticación Rota).

Previene:
  - Brute force attacks en login
  - DoS attacks (Denial of Service)
  - Abuso de endpoints

Limites por endpoint:
  - /auth/login: 5 requests por 15 minutos
  - /auth/register: 3 requests por hora
  - Otros endpoints: 100 requests por minuto
"""

import os
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiter simple en memoria (para producción usar Redis).
    
    Comportamiento por entorno:
      - development: rate limiting DESHABILITADO
      - staging: rate limiting ACTIVO con límites altos (para pruebas)
      - production: rate limiting ESTRICTO
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)  # {client_ip: [timestamp, timestamp, ...]}
        env = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
        self.is_development = env in ("dev", "development")
        self.is_staging = env in ("staging", "qa")
        self.is_production = env in ("prod", "production")
        
        # Multiplicador: staging tiene límites 10x más altos que producción
        self.multiplier = 10 if self.is_staging else 1
        
        # Reglas: {path: (max_requests, time_window_seconds)}
        self.limits = {
            "/api/v1/auth/login": (5, 900),      # 5 requests en 15 minutos
            "/api/v1/auth/register": (3, 3600),  # 3 requests en 1 hora
            "/api/v1/auth/forgot-password": (3, 3600),  # 3 requests en 1 hora
            "/api/v1/auth/reset-password": (5, 1800),   # 5 requests en 30 min
        }
    
    async def dispatch(self, request: Request, call_next) -> JSONResponse:
        # Solo deshabilitar en desarrollo local
        if self.is_development:
            response = await call_next(request)
            return response
        
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        current_time = time.time()
        
        # Determinar límite aplicable
        max_requests = 100 * self.multiplier
        time_window = 60
        
        for limit_path, (limit_count, limit_seconds) in self.limits.items():
            if path.startswith(limit_path):
                max_requests = limit_count * self.multiplier
                time_window = limit_seconds
                break
        
        # Limpiar requests antiguos
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip] 
            if current_time - ts < time_window
        ]
        
        # Verificar límite
        if len(self.requests[client_ip]) >= max_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Demasiadas solicitudes. Intenta más tarde.",
                    "retry_after": time_window
                }
            )
        
        # Registrar request
        self.requests[client_ip].append(current_time)
        
        response = await call_next(request)
        response.headers["RateLimit-Limit"] = str(max_requests)
        response.headers["RateLimit-Remaining"] = str(max_requests - len(self.requests[client_ip]))
        response.headers["RateLimit-Reset"] = str(int(current_time + time_window))
        
        return response
