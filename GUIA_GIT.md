# GUIA_GIT.md — Calzado J&R

Guía práctica y completa para trabajar con Git en este proyecto.

---

## SECCIÓN 0: ¿Dónde estoy? — Orientación rápida

Antes de hacer cualquier cosa, siempre verifica **en qué rama estás** y **qué hay pendiente**.

### Ver la rama actual
```bash
git branch
```
La rama con un `*` al lado es donde estás parado. Ejemplo:
```
  feature/inventario
  hotfix/bug-login
* main                    <-- ESTÁS AQUÍ
```

### Ver TODAS las ramas (locales + remotas)
```bash
git branch -a
```
Las ramas que empiezan con `remotes/origin/` son las que existen en GitHub.

### Ver un resumen rápido de dónde estás
```bash
git status
```
La primera línea te dice la rama y si hay commits pendientes:
```
On branch main
Your branch is up to date with 'origin/main'.
```
Si dice `Your branch is ahead by 2 commits`, tienes 2 commits sin subir.

### Ver el historial de commits recientes
```bash
git log --oneline -10
```
Muestra los últimos 10 commits en formato corto:
```
a3f2b1c feat: agregar reportes cliente
8e1d4a5 fix: corregir login
c2b7e3f feat: sistema de órdenes
```

### Ver la diferencia entre tu código y el remoto
```bash
git fetch origin        # Actualiza la info de GitHub (sin cambiar nada)
git status              # Compara tu código con el remoto
```

---

## SECCIÓN 1: Flujo básico — Commit y push a `main`

### Cuándo usarlo
Para cambios pequeños o rápidos que quieres meter directo a `main`.

### Paso 1: Abrir la terminal en la ruta correcta
```bash
# Git Bash:
cd /c/Users/ronal/SENA/REPOSITORIOS/scrum-calzado_jyr

# PowerShell:
cd C:\Users\ronal\SENA\REPOSITORIOS\scrum-calzado_jyr
```

### Paso 2: Verificar en qué estás
```bash
git status
```
Si dice `On branch main` → estás bien. Si estás en otra rama, cambia:
```bash
git checkout main
git pull origin main
```

### Paso 3: Ver qué archivos cambiaron
```bash
git status
```
Git te muestra qué archivos están:
- **modified** (modificados)
- **new file** (nuevos)
- **deleted** (eliminados)

Para ver los cambios detallados de un archivo:
```bash
git diff fe/src/pages/client/ReportsPage.tsx
```

### Paso 4: Agregar archivos al staging (preparar para commit)
```bash
# Agregar TODO lo que cambió
git add .

# O agregar un archivo específico
git add fe/src/pages/client/ReportsPage.tsx

# O agregar varios archivos específicos
git add fe/src/pages/client/ReportsPage.tsx fe/src/hooks/useAuth.ts
```

### Paso 5: Ver qué se va a commitear (antes de hacerlo)
```bash
git diff --staged
```
Revisa los cambios antes de confirmar. Es tu última oportunidad de corregir.

### Paso 6: Hacer el commit
```bash
git commit -m "feat: agregar filtro de estados en reportes cliente"
```

**Convención de mensajes de commit:**
| Prefijo     | Cuándo usarlo                          | Ejemplo                                        |
|-------------|----------------------------------------|------------------------------------------------|
| `feat:`     | Nueva funcionalidad                    | `feat: agregar carrito de compras`              |
| `fix:`      | Corrección de un bug                   | `fix: corregir login con email incorrecto`      |
| `docs:`     | Cambios en documentación               | `docs: actualizar README`                       |
| `chore:`    | Tareas de mantenimiento                | `chore: actualizar dependencias`                |
| `refactor:` | Reestructurar código sin cambiar funcionalidad | `refactor: extraer hooks de auth`    |
| `style:`    | Estilos, formato (sin lógica)          | `style: aplicar Prettier en components`         |
| `test:`     | Agregar o corregir tests               | `test: agregar test de login`                   |

### Paso 7: Subir a GitHub
```bash
git push origin main
```

### ⚡ Resumen rápido (copiar y pegar):
```bash
git status
git add .
git commit -m "feat: descripción clara del cambio"
git push origin main
```

---

## SECCIÓN 2: Ramas — Trabajar sin afectar a `main`

### Cuándo crear una rama
- Cuando vas a hacer algo **grande o experimental**
- Cuando quieres **probar algo** sin riesgo
- Cuando **varias personas** trabajan en cosas distintas

### Crear una rama nueva
```bash
git checkout -b feature/nombre-descriptivo
```

**Nombres sugeridos de ramas:**
| Tipo          | Ejemplo                                  |
|---------------|------------------------------------------|
| `feature/`    | `feature/carrito-compras`                |
| `fix/`        | `fix/error-login-google`                 |
| `hotfix/`     | `hotfix/pago-roto-produccion`            |
| `refactor/`   | `refactor/sistema-ordenes`               |

### Verificar que estás en la rama nueva
```bash
git branch
```
Deberías ver algo como:
```
  main
* feature/carrito-compras      <-- ESTÁS AQUÍ
```

### Trabajar y hacer commits normalmente
```bash
git add .
git commit -m "feat: implementar parte 1 del carrito"
git add .
git commit -m "feat: agregar botón de eliminar item"
```

### Subir la rama a GitHub
```bash
git push -u origin feature/carrito-compras
```
La primera vez usa `-u` para que Git recuerde la rama. Después solo:
```bash
git push
```

### Crear Pull Request (desde GitHub)
1. Ve a `https://github.com/TU_USUARIO/scrum-calzado_jyr`
2. Aparecerá un botón **"Compare & pull request"**
3. Dale click, escribe una descripción, y crea el PR
4. Después de revisar, haz **merge** desde GitHub

### Volver a `main` después del merge
```bash
git checkout main
git pull origin main
```

### Eliminar una rama local que ya no necesitas
```bash
git branch -d feature/carrito-compras
```

### Eliminar una rama remota que ya fue mergeada
```bash
git push origin --delete feature/carrito-compras
```

---

## SECCIÓN 3: Actualizar el proyecto local

### Cuando tu equipo subió cambios a GitHub
```bash
git checkout main
git pull origin main
```

### Si tienes Docker corriendo, reconstruir
```bash
docker compose down
docker compose up -d --build
```

### Si estás en una rama
```bash
git checkout feature/mi-rama
git pull origin feature/mi-rama
```

### Traer los últimos cambios de main SIN hacer merge
```bash
git fetch origin
git log main..origin/main    # Ver qué commits hay nuevos
git merge origin/main        # Aplicar los cambios
```

---

## SECCIÓN 4: Guardar cambios temporalmente — `git stash`

### Cuándo usarlo
Cuando estás en medio de algo y necesitas **cambiar de rama** o **actualizar** sin perder tu trabajo.

### Guardar cambios temporalmente
```bash
git stash
```
Tu código queda como estaba antes de los cambios.

### Ver los stashes guardados
```bash
git stash list
```
```
stash@{0}: WIP on feature/carrito: a3f2b1c feat: parte 1
stash@{1}: WIP on main: 8e1d4a5 fix: login
```

### Recuperar los cambios
```bash
git stash pop        # Recupera y elimina el stash
git stash apply     # Recupera pero NO elimina el stash (para usarlo en varias ramas)
```

### Descartar un stash (si ya no lo necesitas)
```bash
git stash drop stash@{0}
```

---

## SECCIÓN 5: Qué hacer si algo sale mal

### Opción A: Commiteaste algo mal y NO lo subiste
```bash
# Deshacer el último commit (conserva los cambios en tu PC)
git reset --soft HEAD~1

# Deshacer el commit Y borrar los cambios del staging
git reset HEAD~1
```

### Opción B: Commiteaste y lo subiste
```bash
# Haz un commit nuevo que revierte los cambios
git revert HEAD
git push origin main
```

### Opción C: Hay conflictos al hacer pull
Git te muestra los archivos con conflicto. Busca los markers:
```
<<<<<<< HEAD
tu versión del código
=======
versión que viene del remoto
>>>>>>> origin/main
```
1. Elige qué versión quedarte
2. Borra los markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Guarda el archivo
4. Confirma la resolución:
```bash
git add .
git commit -m "resolve: conflictos merge"
git push origin main
```

### Opción D: Subiste un commit por error a `main`
```bash
# Revertir el último commit y subir el revert
git revert HEAD
git push origin main
```

### Opción E: Quieres ver qué pasó en un commit específico
```bash
git log --oneline -5         # Ver los últimos 5 commits
git show a3f2b1c             # Ver detalles de un commit específico
git diff a3f2b1c..8e1d4a5   # Ver diferencias entre dos commits
```

---

## SECCIÓN 6: Comandos de referencia

```bash
# ─── INFORMACIÓN ──────────────────────────────────────
git branch                  # Ver ramas locales (* = actual)
git branch -a               # Ver todas las ramas (locales + remotas)
git status                  # Ver estado del proyecto
git log --oneline -10       # Ver últimos 10 commits
git log --oneline --graph   # Ver historial con gráfico de ramas
git diff                    # Ver cambios sin staging
git diff --staged           # Ver cambios en staging

# ─── NAVEGACIÓN ──────────────────────────────────────
git checkout main           # Cambiar a rama main
git checkout nombre-rama    # Cambiar a otra rama
git checkout -b nueva-rama  # Crear rama nueva y cambiarme a ella

# ─── TRABAJO ──────────────────────────────────────────
git add .                   # Agregar todo al staging
git add archivo.txt         # Agregar un archivo específico
git commit -m "mensaje"     # Hacer commit
git push                    # Subir cambios a GitHub
git pull                    # Traer y aplicar cambios de GitHub

# ─── STASH ────────────────────────────────────────────
git stash                   # Guardar cambios temporalmente
git stash pop               # Recuperar cambios
git stash list              # Ver stashes guardados

# ─── DESHACER ─────────────────────────────────────────
git reset --soft HEAD~1     # Deshacer commit (conservar cambios)
git revert HEAD             # Revertir último commit (ya subido)
git reset HEAD archivo.txt  # Quitar archivo del staging
```

---

## Flujo típico de trabajo (paso a paso)

```
1. git pull origin main              ← Actualizar
2. git checkout -b feature/mi-cosa   ← Crear rama (si es algo grande)
3. cd fe && pnpm install             ← Si hay dependencias nuevas
4. [HACER CAMBIOS]
5. git status                        ← Ver qué cambió
6. git add .                         ← Agregar cambios
7. git commit -m "feat: ..."         ← Commitear
8. git push -u origin feature/mi-cosa  ← Subir rama
9. Crear PR en GitHub                ← Mergear cuando esté listo
10. git checkout main && git pull    ← Volver a main
```
