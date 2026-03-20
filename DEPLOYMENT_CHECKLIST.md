# 🚀 DEPLOYMENT CHECKLIST — CALZADO J&R

Este documento es una guía paso a paso para ejecutar el proyecto en cualquier máquina sin errores.

---

## 🎯 REQUISITO OBLIGATORIO: Gestor de Dependencias

⚠️ **Este proyecto usa EXCLUSIVAMENTE `pnpm` como gestor de dependencias**

### Por qué pnpm?
- ✅ Más rápido que npm
- ✅ Manejo eficiente de espacio
- ✅ Reproducibilidad garantizada
- ✅ `pnpm-lock.yaml` versionado en git

### ¿QUÉ DEBES HACER?

1. **NO uses npm** - Está completamente eliminado del proyecto
2. **Instala pnpm** (si no lo tienes):
   ```bash
   npm install -g pnpm
   # O si prefieres, descargalo desde: https://pnpm.io/installation
   ```
3. **Verifica tu instalación**:
   ```bash
   pnpm --version  # Debe mostrar versión (ej: 9.0.0+)
   ```

Si por accidente corriste `npm install`, limpia todo:
```bash
cd fe
rm -rf node_modules package-lock.json  # En Windows: Remove-Item node_modules -Recurse -Force
pnpm install
```

---

## 🎯 REQUISITO OBLIGATORIO #2: Gestor de Dependencias Python

⚠️ **Este proyecto usa EXCLUSIVAMENTE `UV` como gestor de dependencias Python**

### Por qué UV?
- ✅ 10-100x más rápido que pip
- ✅ PEP 621 standard (pyproject.toml)
- ✅ Reproducibilidad garantizada
- ✅ Una única fuente: be/pyproject.toml
- ✅ No hay requirements.txt (eliminated)

### ¿QUÉ DEBES HACER?

1. **NO uses pip, poetry, o pipenv** - Están completamente eliminados del proyecto
2. **Instala UV** (si no lo tienes):
   ```bash
   pip install uv
   # O: curl -sSf https://astral.sh/uv/install.sh | sh
   ```
3. **Verifica tu instalación**:
   ```bash
   uv --version  # Debe mostrar versión (ej: 0.1.0+)
   ```

Si por accidente corriste `pip install`, limpia todo:
```bash
cd be
# Elimina cualquier requirements.txt
rm -f requirements.txt requirements-dev.txt  
# Luego:
uv pip install -e .
```

### Verificar que NO hay requirements.txt

El archivo be/requirements.txt fue **ELIMINADO**. Si lo ves en tu clon:
```bash
rm be/requirements.txt
# O en Windows:
Remove-Item be\requirements.txt -Force
```

---

## ✅ Pre-requisitos del Sistema

Antes de empezar, verifica que tu máquina tenga instalado:

- **Docker Desktop** (v20+): [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
- **Git**: Para clonar el repositorio
- **Python 3.12+**: (para desarrollo local sin Docker)
- **Puerto 5432 disponible**: Para PostgreSQL
- **Puerto 8000 disponible**: Para Backend (FastAPI)
- **Puerto 5173 disponible**: Para Frontend (Vite)

**Verificar puertos disponibles:**
```bash
# En macOS/Linux
lsof -i :5432 && echo "5432 EN USO" || echo "5432 DISPONIBLE"
lsof -i :8000 && echo "8000 EN USO" || echo "8000 DISPONIBLE"
lsof -i :5173 && echo "5173 EN USO" || echo "5173 DISPONIBLE"

# En Windows (PowerShell)
netstat -ano | findstr :5432
netstat -ano | findstr :8000
netstat -ano | findstr :5173
```

---

## 🔧 Paso 1: Clonar el Repositorio

```bash
git clone <REPO_URL> calzado-jyr
cd calzado-jyr
```

---

## 📝 Paso 2: Configurar Archivo .env

### 2.1 Copiar plantilla
```bash
cp .env.example .env
```

### 2.2 Editar .env con tus valores

Abre `.env` en tu editor favorito y ACTUALIZA estos campos:

#### 🐘 PostgreSQL
```ini
POSTGRES_PASSWORD=cambia_esta_contrasena_segura
DATABASE_URL=postgresql://jyr_user:cambia_esta_contrasena_segura@db:5432/calzado_jyr_db
```

⚠️ **Importante:** Ambas contraseñas deben coincidir.

Generar contraseña segura:
```bash
# macOS/Linux
openssl rand -base64 24

# Windows (PowerShell)
[Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### 🔐 JWT Secret
```ini
SECRET_KEY=AQUI_VA_UNA_CLAVE_SEGURA_DE_48_CARACTERES
```

Generar SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

#### 📧 Email (OPCIONAL para desarrollo)
Si necesitas recuperación de contraseña:

```ini
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
```

Para Gmail: [Crear App Password](https://support.google.com/accounts/answer/185833)

#### 🌐 URLs (LOCAL)
```ini
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:8000
```

⚠️ **Importante:** 
- Si cambiaste `BE_PORT` o `FE_PORT`, actualiza también estas URLs
- En producción, usar HTTPS y dominio real

### 2.3 Validar .env
```bash
# Verificar que todas las variables requeridas estén presentes
cat .env | grep -E "DATABASE_URL|SECRET_KEY|FRONTEND_URL|MAIL_SERVER"
```

---

## 🐳 Paso 3: Construir y Ejecutar con Docker

### 3.1 Construir imágenes
```bash
docker compose build
```

⏱️ Primera ejecución tarda 2-5 minutos.

### 3.2 Iniciar servicios
```bash
docker compose up -d
```

Esto inicia:
- 🐘 **PostgreSQL** (puerto 5432)
- 🔵 **Backend** (puerto 8000)  
- 🌐 **Frontend** (puerto 5173)

### 3.3 Verificar que todo está corriendo
```bash
docker compose ps
```

Debería mostrar 3 contenedores con estado `Up`:
- `calzado_jyr_db` (PostgreSQL)
- `calzado_jyr_backend` (FastAPI)
- `calzado_jyr_frontend` (React)

---

## 🔍 Paso 4: Verificar que el Backend Iniciò Correctamente

```bash
docker compose logs backend | tail -50
```

**Deberías ver:**
- ✅ `Uvicorn running on http://0.0.0.0:8000`
- ✅ `Database connected successfully` (o similar)
- ✅ `Seed data loaded successfully`

**Si hay errores de configuración:**
```bash
# Ver logs completos del backend
docker compose logs backend

# Ver logs de la base de datos
docker compose logs db
```

---

## 🧪 Paso 5: Probar la Aplicación

### 5.1 Acceder a la aplicación
- **Frontend:** http://localhost:5173
- **Backend Docs:** http://localhost:8000/docs
- **Backend ReDoc:** http://localhost:8000/redoc

### 5.2 Verificar que la BD tiene datos

```bash
# Conectarse a PostgreSQL
docker compose exec db psql -U jyr_user -d calzado_jyr_db

# Adentro de psql, verificar tablas y datos:
\dt                                    # Ver todas las tablas
SELECT COUNT(*) FROM products;         # Debe mostrar 65 productos
SELECT COUNT(*) FROM brands;           # Debe mostrar 5 marcas
SELECT COUNT(*) FROM users;            # Debe mostrar usuarios iniciales
\q                                     # Salir
```

### 5.3 Credenciales de prueba

**Administrador (para todas las rutas):**
```
Email: admin@calzadojyr.com
Contraseña: AdminSegura123!
```

**Jefe de bodega:**
```
Email: jefe@calzadojyr.com
Contraseña: JefeSegura123!
```

**Cliente:**
```
Email: cliente@calzadojyr.com
Contraseña: ClienteSegura123!
```

### 5.4 Pruebas funcionales

**1. Login**
- [ ] Ir a http://localhost:5173/login
- [ ] Ingresar credenciales de admin
- [ ] Verificar que no hay errores en la consola Browser (F12)
- [ ] Verificar que redirige a /dashboard

**2. Ver Catálogo**
- [ ] En dashboard, hacer click en "Catálogo"
- [ ] Verificar que se cargan 65 productos
- [ ] Verificar que se muestran brand_name, categoryname, etc.

**3. Ver Inventario**
- [ ] En dashboard, hacer click en "Inventario"
- [ ] Verificar que se muestran productos con cantidades

**4. Crear Orden**
- [ ] Crear una orden de prueba
- [ ] Verificar que aparece en la lista
- [ ] Verificar que el inventario se actualiza

---

## 🛑 Solución de Problemas

### Problema: "Connection refused" en el backend

**Causa Probable:** Base de datos no está lista

**Solución:**
```bash
# Ver logs de la DB
docker compose logs db

# Esperar 10 segundos y reintentar
docker compose restart backend
```

### Problema: "Invalid DATABASE_URL" o "SECRET_KEY too short"

**Causa Probable:** .env tiene valores inválidos

**Solución:**
```bash
# 1. Verificar .env
cat .env

# 2. Regenerar valores seguros
python -c "import secrets; print(secrets.token_urlsafe(48))"

# 3. Actualizar .env
# 4. Reconstruir y reiniciar
docker compose down
docker compose up -d --build
```

### Problema: "Frontend cannot reach backend" (error de CORS)

**Causa Probable:** FRONTEND_URL o VITE_API_URL incorrecta

**Solución:**
```bash
# 1. Verificar que FRONTEND_URL y VITE_API_URL son correctas en .env
cat .env | grep "FRONTEND_URL\|VITE_API_URL"

# 2. Ver logs del backend
docker compose logs backend | grep -i cors

# 3. Reiniciar con rebuild
docker compose down
docker compose up -d --build
```

### Problema: Puerto ya en uso

**Solución:**
```bash
# Cambiar puertos en .env
# BE_PORT=8001  (cambiar de 8000)
# FE_PORT=5174  (cambiar de 5173)

# Actualizar también las URLs
# FRONTEND_URL=http://localhost:5174
# VITE_API_URL=http://localhost:8001

# Reconstruir
docker compose up -d --build
```

### Problema: "No products found" en el frontend

**Causa Probable:** Seed data no se ejecutó

**Solución:**
```bash
# Ver seed logs
docker compose logs backend | grep -i "seed"

# Si no hay seed logs, forzar reinicialización
docker compose down --volumes  # ALERTA: Borra la BD
docker compose up -d --build
```

---

## 📊 Monitoreo y Mantenimiento

### Ver logs en tiempo real
```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend  
docker compose logs -f frontend
```

### Limpiar todo (cuidado ⚠️)
```bash
# Detener servicios
docker compose down

# Detener + borrar volúmenes de BD (PIERDE DATOS)
docker compose down --volumes

# Limpiar también imágenes
docker compose down --volumes --remove-orphans --rmi all
```

### Reiniciar un servicio específico
```bash
docker compose restart backend
docker compose restart frontend
docker compose restart db
```

---

## 📋 Checklist para Producción

- [ ] DATABASE_URL con credenciales seguras generadas
- [ ] SECRET_KEY con valor seguro generado (min 32 chars)
- [ ] FRONTEND_URL = dominio HTTPS real
- [ ] VITE_API_URL = URL del backend HTTPS real
- [ ] MAIL_SERVER configurado con credenciales válidas
- [ ] BE_PORT y FE_PORT abiertos en firewall
- [ ] Certificados SSL/TLS configurados
- [ ] Backups de BD programados
- [ ] Logs centralizados (ELK, CloudWatch, etc.)
- [ ] Monitoreo de recursos activo
- [ ] Plan de recuperación ante desastres documentado

---

## ✅ Validación Final Exitosa

Si llegar aquí sin errores:
- ✅ Docker está instalado y funcionando
- ✅ .env está correctamente configurado
- ✅ BD se inicializó con éxito
- ✅ Backend está en línea
- ✅ Frontend está sirviendo
- ✅ Datos se cargaron (65 productos)
- ✅ Credenciales de prueba funcionan
- ✅ Proyecto está listo para usar

🎉 **¡El proyecto está completamente funcional!**

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker compose logs`
2. Consulta la sección "Solución de Problemas" arriba
3. Verifica que los puertos 5432, 8000, 5173 estén disponibles
4. Asegúrate de que .env tiene todos los campos requeridos
5. Abre un issue en el repositorio con:
   - Salida de `docker compose logs`
   - Tu versión de Docker: `docker --version`
   -Tus valores .env (sin valores sensibles)
