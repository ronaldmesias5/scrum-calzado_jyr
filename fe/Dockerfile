# ============================================================
# CALZADO J&R — Dockerfile Frontend (React + Vite + nginx)
# ============================================================
# ¿Qué?    Imagen Docker multi-stage para el frontend React/TS.
# ¿Para?   Desarrollo con hot-reload y producción optimizada
#           con nginx sirviendo archivos estáticos.
# ¿Impacto? El stage "prod" compila el proyecto a HTML/CSS/JS
#           puro y lo sirve con nginx (<10 MB de imagen final),
#           sin Node.js en producción.
# ============================================================

# ────────────────────────────
# Stage 1 — base
# Instala dependencias npm. Se reutiliza en dev y builder.
# ¿Por qué copiar solo package*.json primero?
#   Docker invalidará la capa de pnpm install SOLO si estos
#   archivos cambian, no si cambia el código fuente.
# ────────────────────────────
FROM node:20-alpine AS base

# Habilitar pnpm vía Corepack (incluido en Node 20+, sin instalación adicional).
# ¿Qué es Corepack? Gestor de gestores de paquetes integrado en Node.js.
# ¿Por qué no instalar pnpm globalmente? Corepack es la forma oficial y no
#   requiere npm ni acceso root; lee la versión de "packageManager" en package.json.
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar manifests de dependencias antes que el código fuente
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias. Usar --no-frozen-lockfile si es necesario
# regenerar el pnpm-lock.yaml en caso de que esté desincronizado.
RUN pnpm install

# ────────────────────────────
# Stage 2 — dev
# ¿Qué?    Target para desarrollo con Vite HMR en Docker Compose.
# ¿Para?   El código se monta como volumen (./fe:/app) y el
#           servidor Vite detecta cada cambio al instante.
# ¿Impacto? Hot Module Replacement (HMR) funciona dentro del
#           contenedor y es visible en el navegador del host.
#   - node_modules NO se montan desde el host; Docker preserva
#     los del contenedor con un volumen anónimo (ver compose).
# ────────────────────────────
FROM base AS dev

EXPOSE 5173

# --host 0.0.0.0: Vite escucha en todas las interfaces del contenedor.
# Sin esto, solo escucha en 127.0.0.1 y el host no puede conectarse.
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]

# ────────────────────────────
# Stage 3 — builder
# ¿Qué?    Compila el proyecto TypeScript + React a archivos estáticos.
# ¿Para?   El output de Vite (dist/) es HTML/CSS/JS minificado listo
#           para servir con cualquier servidor web.
# ¿Impacto? Separa la etapa de compilación de la de ejecución.
#           Node.js (>100 MB) no llega a la imagen final de producción.
# ────────────────────────────
FROM base AS builder

# Copiar el código fuente completo para el build
COPY . .

# Compila: TypeScript check + Vite bundle + optimización de assets
RUN pnpm run build

# ────────────────────────────
# Stage 4 — prod
# ¿Qué?    Imagen final de producción: solo nginx + archivos estáticos.
# ¿Para?   Servir la aplicación React como SPA con rutas correctas.
# ¿Impacto? Imagen final ~15 MB vs ~300 MB con Node. nginx maneja
#           TLS, compresión gzip, caché de assets automáticamente.
# ────────────────────────────
FROM nginx:stable-alpine AS prod

# Copiar los archivos compilados desde el stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración personalizada de nginx para React SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
