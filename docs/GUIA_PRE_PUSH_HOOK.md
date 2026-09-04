# Guia: Pre-push Hook para CALZADO J&R

## Que es esto?

El **pre-push hook** es un script que se ejecuta **automaticamente** cada vez que haces `git push`. Si algun check falla, el push se **bloquea** para que no lleguen errores a GitHub.

Esto evita problemas como:
- Errores de linting (ruff)
- Tests que fallan (pytest, vitest)
- Errores de TypeScript (tsc)
- Migraciones de BD con IDs demasiado largos

---

## Prerequisitos

Antes de configurar el hook, necesitas tener instalado:

### 1. Docker Desktop
- Descarga desde: https://www.docker.com/products/docker-desktop
- Verifica: `docker --version`

### 2. Node.js (version 22+)
- Descarga desde: https://nodejs.org
- Verifica: `node --version`

### 3. pnpm (gestor de paquetes)
```bash
npm install -g pnpm
```
- Verifica: `pnpm --version`

### 4. Git
- Ya deberias tenerlo instalado
- Verifica: `git --version`

---

## Configuracion (una sola vez)

Despues de clonar el repositorio, ejecuta estos comandos en la terminal:

```bash
# 1. Activar el pre-push hook
git config core.hooksPath .githooks

# 2. Verificar que se activo
git config core.hooksPath
# Deberia imprimir: .githooks
```

**Listo!** A partir de ahora, cada `git push` ejecutara los checks automaticamente.

---

## Como funciona?

Cuando haces `git push`, el hook corre 5 checks en orden:

```
[1/5] Validando IDs de migracion (<=32 chars)...
[2/5] Ruff check (backend)...
[3/5] Pytest (backend, via Docker)...
[4/5] TypeScript typecheck (frontend)...
[5/5] Frontend tests (vitest)...
```

Si **todos pasan**, el push se ejecuta normalmente.
Si **alguno falla**, el push se bloquea y ves el error.

### Que verifica cada check:

| Check | Que hace | Donde corre |
|-------|----------|-------------|
| Migration IDs | Valida que los revision IDs de Alembic sean <= 32 chars | Local |
| Ruff check | Verifica estilo de codigo Python | Docker |
| Pytest | Ejecuta todos los tests del backend | Docker |
| TypeScript | Verifica que no haya errores de tipos | Local |
| Vitest | Ejecuta los tests del frontend | Local |

---

## Uso manual

Si quieres verificar **antes de hacer commit**, puedes correr el script manualmente:

```bash
.\scripts\check.ps1
```

Esto corre los mismos 5 checks que el pre-push hook.

---

## Si el push falla

### Paso 1: Leer el error
El script te dice cual check fallo, por ejemplo:
```
[3/5] Pytest (backend, via Docker)...
  FAIL - pytest fallo:
  FAILED tests/test_orders.py::test_create_order - AssertionError
```

### Paso 2: Corregir el error
- Si es **ruff**: corrige los problemas de estilo en el codigo Python
- Si es **pytest**: arrega el test que falla
- Si es **tsc**: corrige los errores de tipos en TypeScript
- Si es **vitest**: arrega el test del frontend
- Si es **migration ID**: acorta el revision ID de la migracion (maximo 32 caracteres)

### Paso 3: Volver a intentar
```bash
# Verificar que todo pasa
.\scripts\check.ps1

# Si pasa, hacer push
git push
```

---

## Saltarse el hook (no recomendado)

Si tienes una emergencia y necesitas subir rapido:

```bash
git push --no-verify
```

**IMPORTANTE:** Esto no deberia hacerse normalmente. Solo usa esto si:
- Hay un bug critico en produccion que necesita arreglo inmediato
- El hook esta fallando por un problema de configuracion, no del codigo

---

## Para nuevos desarrolladores

Cuando clones el repositorio por primera vez:

```bash
# 1. Clonar el repo
git clone https://github.com/ronaldmesias5/scrum-calzado_jyr.git
cd scrum-calzado_jyr

# 2. Activar el pre-push hook
git config core.hooksPath .githooks

# 3. Levantar Docker (para los tests del backend)
docker compose up -d --build

# 4. Instalar dependencias del frontend
cd fe
pnpm install
cd ..

# 5. Verificar que todo funciona
.\scripts\check.ps1
```

---

## Archivos importantes

| Archivo | Descripcion |
|---------|-------------|
| `.githooks/pre-push` | El hook de git que se ejecuta antes de cada push |
| `scripts/check.ps1` | El script que corre todos los checks |
| `AGENTS.md` | Documentacion del proyecto (incluye info del hook) |

---

## Solucion de problemas

### "El hook no se ejecuta al hacer push"
- Verifica que este activado: `git config core.hooksPath`
- Si no muestra `.githooks`, ejecuta: `git config core.hooksPath .githooks`

### "Docker no esta corriendo"
- Abre Docker Desktop y espera a que este verde
- Verifica: `docker ps`

### "pnpm no se encuentra"
- Instala: `npm install -g pnpm`
- Verifica: `pnpm --version`

### "Error de permisos en el script"
- En PowerShell: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- En Git Bash: `chmod +x .githooks/pre-push`

---

## Resumen

1. **Una sola vez**: `git config core.hooksPath .githooks`
2. **Cada push**: El hook corre automaticamente
3. **Si falla**: Corrige el error y vuelve a intentar
4. **Manual**: `.\scripts\check.ps1` para verificar sin hacer push
5. **Emergencia**: `git push --no-verify` (no recomendado)
