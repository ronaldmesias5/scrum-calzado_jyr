# ════════════════════════════════════════
# 📄 Configuración del sistema de logs (4 loggers rotativos)
# ════════════════════════════════════════

import logging
import logging.handlers
import re
from pathlib import Path


class SecretScrubbingFilter(logging.Filter):
    """Enmascara secretos potenciales (contraseñas, tokens, API keys) en los
    mensajes de log antes de escribirlos. Red de seguridad si algún módulo
    registra accidentalmente credenciales."""

    # Claves comunes con valores entre comillas simples o dobles
    _QUOTED = re.compile(
        r"(password|passwd|pwd|secret|api_key|apikey|access_token|refresh_token|token|authorization)"
        r"([\"']?\s*[:=]\s*[\"']?)([^\"'\s,}]{4,})([\"']?)",
        re.IGNORECASE,
    )

    # Token Bearer (Authorization: Bearer eyJ...) — el valor va tras un espacio
    _BEARER = re.compile(r"(?i)(bearer\s+)([A-Za-z0-9\-_.~+/=]{8,})")

    def _scrub(self, message: str) -> str:
        message = self._BEARER.sub(lambda m: f"{m.group(1)}***REDACTED***", message)
        return self._QUOTED.sub(
            lambda m: f"{m.group(1)}{m.group(2)}***REDACTED***{m.group(4)}", message
        )

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self._scrub(record.msg)
        if record.args:
            try:
                record.args = tuple(
                    self._scrub(str(a)) if isinstance(a, str) else a for a in record.args
                )
            except Exception:
                pass
        return True


def _scrubbing_handler_filter():
    """Retorna una nueva instancia del filtro (una por handler)."""
    return SecretScrubbingFilter()


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
        logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    )
    audit_handler.addFilter(_scrubbing_handler_filter())
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
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
        )
    )
    error_logger.addHandler(error_handler)
    error_handler.addFilter(_scrubbing_handler_filter())

    # También enviar a consola en desarrollo
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.ERROR)
    console_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
    error_logger.addHandler(console_handler)
    console_handler.addFilter(_scrubbing_handler_filter())

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
        logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    )
    app_logger.addHandler(app_handler)
    app_handler.addFilter(_scrubbing_handler_filter())

    # También enviar a consola (stdout/stderr) para visibilidad en
    # `docker compose logs be` y en producción (12-factor: logs a stdout).
    app_console_handler = logging.StreamHandler()
    app_console_handler.setLevel(logging.INFO)
    app_console_handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
    app_logger.addHandler(app_console_handler)
    app_console_handler.addFilter(_scrubbing_handler_filter())

    # ────────────────────────────
    # 4. Logger IA (Fase 4, asistente)
    # ────────────────────────────
    ai_logger = logging.getLogger("ai")
    ai_logger.setLevel(logging.INFO)

    ai_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "ai.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
    )
    ai_handler.setFormatter(
        logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    )
    ai_logger.addHandler(ai_handler)
    ai_handler.addFilter(_scrubbing_handler_filter())

    return {
        "audit": audit_logger,
        "error": error_logger,
        "app": app_logger,
        "ai": ai_logger,
    }


# Inicializar loggers al importar este módulo
_loggers = configure_logging()

audit_logger = _loggers["audit"]
error_logger = _loggers["error"]
app_logger = _loggers["app"]
ai_logger = _loggers["ai"]
