# ============================================================
# Dockerfile — PostgreSQL 17 con Bootstrap Técnico
# ============================================================
# ¿Qué?    Imagen personalizada de PostgreSQL para CALZADO J&R.
# ¿Para?   Incluir extensiones y configuraciones técnicas necesarias.
# ¿Impacto? Garantiza que todas las máquinas (dev, staging, prod)
#           tengan la misma configuración de PostgreSQL.
#
# IMPORTANTE: Este archivo es OPCIONAL en docker-compose.yml
#             Actualmente usa postgres:17-alpine directo.
#             Si quieres usar esta imagen personalizada, actualiza
#             docker-compose.yml: db.image → db.build: ./db
# ============================================================

FROM postgres:17-alpine

# ============================================================
# METADATOS
# ============================================================
LABEL maintainer="CALZADO J&R <desarrollo@calzadojyr.com>"
LABEL description="PostgreSQL 17 con bootstrap técnico para CALZADO J&R"
LABEL version="1.0"

# ============================================================
# VARIABLES DE ENTORNO (heredadas de postgres:17-alpine)
# ============================================================
# POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB se pasan desde docker-compose.yml
# Documentadas aquí como referencia:
#   POSTGRES_USER=jyr_user (definida en .env)
#   POSTGRES_PASSWORD=jyr_password (definida en .env)
#   POSTGRES_DB=calzado_jyr_db (definida en .env)

# ============================================================
# COPIAR SCRIPTS DE INICIALIZACIÓN
# ============================================================
# Los scripts en /docker-entrypoint-initdb.d/ se ejecutan
# UNA SOLA VEZ cuando PostgreSQL se inicializa por primera vez.
# Orden: alfabético (00_*, 01_*, etc.)
COPY init/ /docker-entrypoint-initdb.d/

# ============================================================
# LOGS Y VERIFICACIÓN
# ============================================================
# Este comentario es documentación para futuros mantenedores:
# 
# Archivos que se ejecutan al inicializar:
#   - /docker-entrypoint-initdb.d/init.sql
#     └─> CREATE EXTENSION uuid-ossp
#     └─> CREATE EXTENSION pg_trgm
#     └─> ALTER DATABASE SET timezone TO 'UTC'
#
# ============================================================

# Puerto por defecto de PostgreSQL (heredado de postgres:17-alpine)
EXPOSE 5432

# healthcheck ya definido en docker-compose.yml
# (No necesario replicar aquí)
