"""
Módulo: logging_config.py
Descripción: Configuración centralizada de logging para la aplicación.

Proporciona:
  - Logger para auditoría (events de seguridad)
  - Logger para errores (stack traces del servidor)
  - Logger general de aplicación
  - Rotación de archivos para no llenar disco
"""

import logging
import logging.handlers
from pathlib import Path
from datetime import datetime


def configure_logging():
    """Configura y retorna loggers para la aplicación."""
    
    # Crear directorio de logs
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # ────────────────────────────
    # 1. Logger de AUDITORÍA (eventos de seguridad)
    # ────────────────────────────
    audit_logger = logging.getLogger("audit")
    audit_logger.setLevel(logging.INFO)
    
    audit_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "audit.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10,  # Mantener 10 backups
    )
    audit_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    )
    audit_logger.addHandler(audit_handler)
    
    # ────────────────────────────
    # 2. Logger de ERRORES (stack traces, excepciones)
    # ────────────────────────────
    error_logger = logging.getLogger("error")
    error_logger.setLevel(logging.ERROR)
    
    error_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10,
    )
    error_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s | %(levelname)s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    )
    error_logger.addHandler(error_handler)
    
    # También enviar a consola en desarrollo
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.ERROR)
    console_handler.setFormatter(
        logging.Formatter('%(levelname)s: %(message)s')
    )
    error_logger.addHandler(console_handler)
    
    # ────────────────────────────
    # 3. Logger general (info, debug)
    # ────────────────────────────
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    
    app_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
    )
    app_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    )
    app_logger.addHandler(app_handler)
    
    return {
        "audit": audit_logger,
        "error": error_logger,
        "app": app_logger,
    }


# Inicializar loggers al importar este módulo
_loggers = configure_logging()

audit_logger = _loggers["audit"]
error_logger = _loggers["error"]
app_logger = _loggers["app"]
