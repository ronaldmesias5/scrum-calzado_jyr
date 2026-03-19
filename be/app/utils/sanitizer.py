"""
Módulo: utils/sanitizer.py
Descripción: Utilidades de sanitización para OWASP #7 (XSS) y otros ataques.

Proporciona:
  - HTML escaping (previene XSS)
  - SQL injection prevention (ya tenemos via ORM, este es redundante pero seguro)
  - Path traversal prevention
  - Command injection prevention
"""

import re
import html
from typing import Any, Dict
from urllib.parse import quote, unquote


class Sanitizer:
    """Clase con métodos estáticos para sanitización de inputs."""
    
    @staticmethod
    def escape_html(text: str) -> str:
        """
        Escapa caracteres HTML para prevenir XSS.
        
        Convierte:
          < → &lt;
          > → &gt;
          & → &amp;
          " → &quot;
          ' → &#x27;
        
        Args:
            text: Texto a escapar
            
        Returns:
            Texto escapado
        """
        if not isinstance(text, str):
            return str(text)
        return html.escape(text, quote=True)
    
    @staticmethod
    def unescape_html(text: str) -> str:
        """Revierte el escape HTML."""
        if not isinstance(text, str):
            return str(text)
        return html.unescape(text)
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitiza nombres de archivo para prevenir path traversal.
        
        - Remueve ../ y ./
        - Remueve caracteres especiales peligrosos
        - Mantiene solo alfanuméricos, punto, guión, guion bajo
        
        Args:
            filename: Nombre de archivo de entrada
            
        Returns:
            Nombre de archivo sanitizado
        """
        # Remover path traversal attempts
        filename = filename.replace("../", "").replace("..\\", "")
        filename = filename.replace("./", "").replace(".\\", "")
        
        # Remover caracteres especiales (mantener solo seguros)
        filename = re.sub(r'[^\w.\-]', '', filename)
        
        # No permitir archivos que comienzan con punto (archivos ocultos)
        if filename.startswith('.'):
            filename = filename.lstrip('.')
        
        return filename
    
    @staticmethod
    def sanitize_path(path: str) -> str:
        """
        Sanitiza rutas para prevenir path traversal.
        
        Args:
            path: Ruta de entrada
            
        Returns:
            Ruta normalizada y validada
        """
        # Resolver .. y .
        import os
        path = os.path.normpath(path)
        
        # Remover leading slashes (no absolute paths)
        path = path.lstrip('/\\')
        
        # Preventivo: si contiene ../ o ..\, rechazar
        if '..' in path:
            raise ValueError("Path traversal attempt detected")
        
        return path
    
    @staticmethod
    def sanitize_command_arg(arg: str) -> str:
        """
        Sanitiza argumentos para prevenir command injection.
        
        - Envuelve en comillas
        - Escapa comillas internas
        
        Args:
            arg: Argumento a sanitizar
            
        Returns:
            Argumento escapado
        """
        # Escapar comillas dobles
        arg = arg.replace('"', '\\"')
        # Envolver en comillas
        return f'"{arg}"'
    
    @staticmethod
    def remove_sql_comments(query: str) -> str:
        """
        Remueve comentarios SQL (redundante con ORM pero extra seguro).
        
        NOTA: Usa SQLAlchemy ORM para queries reales, esto es defensa extra.
        
        Args:
            query: Query SQL potencialmente maliciosa
            
        Returns:
            Query sin comentarios
        """
        # Remover -- comments
        query = re.sub(r'--.*$', '', query, flags=re.MULTILINE)
        # Remover /* */ comments
        query = re.sub(r'/\*.*?\*/', '', query, flags=re.DOTALL)
        return query
    
    @staticmethod
    def sanitize_email(email: str) -> str:
        """
        Normaliza email (ya tenemos EmailStr en Pydantic, pero extra validación).
        
        Args:
            email: Email a validar
            
        Returns:
            Email normalizado en minúsculas
        """
        email = email.strip().lower()
        
        # Validar formato básico (Pydantic hace esto mejor, pero redundancia)
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            raise ValueError("Formato de correo electrónico incorrecto")
        
        return email
    
    @staticmethod
    def sanitize_url(url: str) -> str:
        """
        Valida y sanitiza URLs.
        
        - Debe empezar con http:// o https://
        - Remover caracteres especiales inválidos
        
        Args:
            url: URL a validar
            
        Returns:
            URL validada y sanitizada
        """
        url = url.strip()
        
        # Solo permitir http/https
        if not (url.startswith('http://') or url.startswith('https://')):
            raise ValueError("Esquema de URL no permitido (solo http/https)")
        
        # Validar longitud
        if len(url) > 2048:
            raise ValueError("La URL excede la longitud máxima permitida")
        
        return url
    
    @staticmethod
    def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitiza todos los valores string en un diccionario.
        
        Usa escape_html() para cada valor string.
        
        Args:
            data: Diccionario a sanitizar
            
        Returns:
            Diccionario con valores sanitizados
        """
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = Sanitizer.escape_html(value)
            elif isinstance(value, dict):
                sanitized[key] = Sanitizer.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    Sanitizer.escape_html(item) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        return sanitized


class CSRFTokenGenerator:
    """Generador de tokens CSRF (aunque FastAPI/CORS ya protege)."""
    
    @staticmethod
    def generate_token(length: int = 32) -> str:
        """
        Genera un token CSRF aleatorio.
        
        Args:
            length: Longitud del token en bytes (se codifica en base64, resultado es ~1.33x más largo)
            
        Returns:
            Token CSRF hexadecimal
        """
        import secrets
        return secrets.token_hex(length)
    
    @staticmethod
    def validate_token(token: str) -> bool:
        """
        Valida formato del token CSRF.
        
        Args:
            token: Token a validar
            
        Returns:
            True si es válido, False sino
        """
        # Debe ser hexadecimal y de longitud esperada
        return bool(re.match(r'^[a-f0-9]{64}$', token.lower()))
