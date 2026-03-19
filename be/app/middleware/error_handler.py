"""
Módulo: middleware/error_handler.py
Descripción: Manejador de errores para OWASP #10 (Evitar divulgación de información).

Capa de error manejo que:
  - Captura excepciones no manejadas
  - Devuelve mensajes genéricos al cliente
  - Registra detalles completos en servidor (NO devuelve stack traces)
  - Retorna códigos HTTP apropiados
  - Previene information leakage
"""

import traceback
from typing import Optional

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware

# Usar loggers centralizados
from app.core.logging_config import error_logger


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware que maneja excepciones y previene information leakage."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Intercepta errores y devuelve respuestas seguras."""
        try:
            response = await call_next(request)
            return response
        
        except RequestValidationError as exc:
            # Errores de validación de Pydantic → 422
            client_ip = request.client.host if request.client else "unknown"
            error_logger.warning(
                f"Validation error on {request.url.path} from {client_ip}: {str(exc)}"
            )
            
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "detail": "Los datos enviados son incorrectos",
                    "errors": exc.errors()  # Pydantic proporciona detalles seguros
                }
            )
        
        except Exception as exc:
            # Todas las demás excepciones no esperadas
            client_ip = request.client.host if request.client else "unknown"
            
            # Registrar detalles COMPLETOS en servidor (NUNCA en response)
            full_traceback = traceback.format_exc()
            error_logger.error(
                f"Unhandled exception on {request.url.path} from {client_ip}\n{full_traceback}"
            )
            
            # Determinar código HTTP basado en tipo de excepción
            status_code = self._get_status_code(exc)
            
            # Mensaje genérico para el cliente (SIN detalles técnicos)
            return JSONResponse(
                status_code=status_code,
                content={
                    "detail": self._get_user_message(status_code),
                    # NO incluir: exception type, stack trace, database details, etc.
                }
            )
    
    @staticmethod
    def _get_status_code(exc: Exception) -> int:
        """Mapea excepciones a códigos HTTP seguros."""
        
        # Excepciones de validación/negocio → 400 Bad Request
        if isinstance(exc, ValueError):
            return status.HTTP_400_BAD_REQUEST
        
        # Excepciones de permiso → 403 Forbidden
        if isinstance(exc, PermissionError):
            return status.HTTP_403_FORBIDDEN
        
        # Excepciones de recursos no encontrados → 404 Not Found
        if isinstance(exc, FileNotFoundError):
            return status.HTTP_404_NOT_FOUND
        
        # Timeout → 504 Gateway Timeout
        if isinstance(exc, TimeoutError):
            return status.HTTP_504_GATEWAY_TIMEOUT
        
        # Default: 500 Internal Server Error
        return status.HTTP_500_INTERNAL_SERVER_ERROR
    
    @staticmethod
    def _get_user_message(status_code: int) -> str:
        """Devuelve mensaje seguro basado en código HTTP."""
        messages = {
            status.HTTP_400_BAD_REQUEST: "Los datos de la solicitud son incorrectos",
            status.HTTP_403_FORBIDDEN: "Acceso denegado",
            status.HTTP_404_NOT_FOUND: "Recurso no encontrado",
            status.HTTP_422_UNPROCESSABLE_ENTITY: "Error de validación en los datos enviados",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Ocurrió un error interno en el servidor",
            status.HTTP_504_GATEWAY_TIMEOUT: "Tiempo de espera agotado",
        }
        return messages.get(status_code, "Ha ocurrido un error")


class CustomErrorResponse:
    """Clase auxiliar para respuestas de error estandarizadas."""
    
    @staticmethod
    def bad_request(detail: str = "Los datos de la solicitud son incorrectos") -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": detail}
        )
    
    @staticmethod
    def unauthorized(detail: str = "No autorizado") -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": detail}
        )
    
    @staticmethod
    def forbidden(detail: str = "Acceso denegado") -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": detail}
        )
    
    @staticmethod
    def not_found(detail: str = "Recurso no encontrado") -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": detail}
        )
    
    @staticmethod
    def internal_error(detail: str = "Error interno del servidor") -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": detail}
        )
