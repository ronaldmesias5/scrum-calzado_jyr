# 📤 GUÍA PARA SUBIR A GITHUB — CALZADO J&R

**Versión:** 1.0  
**Fecha:** 19 de marzo de 2026  
**Estado:** ✅ VERIFICADO

---

## ⚠️ PASOS PREVIOS (CRÍTICO)

### 1. Verificar que .env está protegido:
```bash
git check-ignore .env
# Debe retornar: ".env"  ✅
```

### 2. Verificar que .env.example NO contiene secretos:
```bash
cat .env.example | grep -E "SECRET_KEY|MAIL_PASSWORD|POSTGRES_PASSWORD"
# Debe mostrar: placeholder/templates, NO valores reales ✅
```

---

## 🧹 PASO 1: LIMPIAR ARCHIVOS INNECESARIOS

Estos archivos están en `git status` pero NO deben subirse. **Ejecutar en orden:**

### Eliminar scripts de prueba:
```bash
rm -f fix_audit_fields.py
rm -f test_api.py
rm -f test_conexion_definitiva.ps1
rm -f test_login_definitivo.ps1
rm -f TEST_EXHAUSTIVO.ps1
```

### Eliminar archivos SQL temporales:
```bash
rm -f sync_columns.sql
```

### Eliminar documentación temporal:
```bash
rm -f SOLUCION_CONEXION_DEFINITIVA.md
rm -f SOLUCION_DEFINITIVA_BD_SINCRONIZADA.md
rm -f SOLUCION_DEFINITIVA_COMPLETA.md
rm -f VERIFICACION_FINAL_SYNC.md
rm -f ARQUITECTURA_MODULAR.md
```

### Limpiar directorio docs:
```bash
rm -rf docs/AUDITORIA_*.md
rm -f docs/CAMBIOS_REALIZADOS.md
rm -f docs/INDICE_SEGURIDAD.md
rm -f docs/OWASP_*.md
rm -f docs/QUICKSTART_SECURITY.md
rm -f docs/RELACIONES_BASE_DATOS.md
rm -f docs/RESUMEN_EJECUTIVO_*.md
rm -f docs/SECURITY_*.md
rm -f docs/TESTING_*.md
rm -f docs/VERIFICACION_*.md
rm -f docs/compliance_*.md
rm -f docs/optimization_*.md
```

### Eliminar directorios de runtime (ignorados por git, pero limpiar):
```bash
rm -rf be/logs/
# NO eliminar: be/uploads (puede contener datos importantes)
rm -f be/requirements-security.txt  # (si es redundante)
```

---

## ✅ PASO 2: VERIFICAR ESTADO LIMPIO

```bash
git status
```

**Esperado:** Solo archivos modificados (M), sin archivos sin trackear (??) o eliminados (D)

```
Cambios no confirmados:
        modificado:   COMO_CORRER_PROYECTO.md
        modificado:   be/app/main.py
        modificado:   be/app/modules/orders/router.py
        modificado:   be/app/modules/orders/schemas.py
        modificado:   fe/src/modules/dashboard-jefe/pages/OrdersPage.tsx
        modificado:   fe/src/modules/dashboard-jefe/services/catalogService.ts
        ... (solo M modificados)
```

---

## 📝 PASO 3: HACER COMMIT CON MENSAJE DESCRIPTIVO

```bash
git add .
git commit -m "feat: Fix product image display in order details

- Add new endpoint /api/v1/uploads/{file_path} with explicit CORS headers
- Update resolveImageUrl() to use new CORS-enabled endpoint
- Change OrdersPage image rendering from object-cover to object-contain
- Increase thumbnail size from 80x80 to 140x140px with inline styles
- Add crossOrigin='anonymous' attribute to img tags
- Disable rate limiting in development mode

Related to: Product image visibility issue in order details modal
Impact: Images now display correctly in both catalog and orders views"
```

---

## 🔍 PASO 4: VERIFICAR CAMBIOS ANTES DE PUSH

```bash
git log --oneline -5
# Debe ver el nuevo commit arriba

git diff HEAD~1 HEAD --stat
# Muestra resumen de cambios
```

---

## 🚀 PASO 5: SUBIR A GITHUB

### Opción A: Si es nuevo repositorio:
```bash
git remote add origin https://github.com/<usuario>/calzado-jyr.git
git branch -M main
git push -u origin main
```

### Opción B: Si ya existe remoto:
```bash
git push origin main
```

---

## ✅ PASO 6: VERIFICAR EN GITHUB

```bash
# En GitHub.com:
# 1. Abrir https://github.com/<usuario>/calzado-jyr
# 2. Verificar que los archivos aparecen correctamente
# 3. Confirmar que .env NO aparece
# 4. Confirmar que documentación temporal NO aparece
```

---

## 🧪 PASO 7: VERIFICAR EN NUEVA PC (TEST)

Clonar en otra carpeta y verificar que todo funciona:

```bash
# En otra carpeta
mkdir test-clone
cd test-clone
git clone https://github.com/<usuario>/calzado-jyr.git
cd calzado-jyr

# Configurar
cp .env.example .env
# Editar .env si es necesario

# Verificar archivos críticos
ls -la be/requirements.txt      # ✅ Debe existir
ls -la fe/package.json          # ✅ Debe existir
ls -la docker-compose.yml       # ✅ Debe existir
ls -la db/init/                 # ✅ Debe tener 4 .sql

# Iniciar Docker
docker-compose up -d

# Verificar
docker-compose ps              # ✅ Todos UP
curl http://localhost:8000/api/v1/health  # ✅ 200 OK
# Browser: http://localhost:5173           # ✅ Funciona

# Verificar que imágenes se ven
# 1. Login
# 2. Ver orden
# 3. Confirmar que miniaturas muestran imágenes ✅
```

---

## 📋 CHECKLIST FINAL ANTES DE PUSH

- [ ] ✅ Archivos temporales eliminados
- [ ] ✅ Scripts de prueba eliminados
- [ ] ✅ Documentación temporal eliminada
- [ ] ✅ `.env` está en `.gitignore` y no se va a subir
- [ ] ✅ `.env.example` no contiene secretos
- [ ] ✅ Commit tiene mensaje descriptivo
- [ ] ✅ `git status` está limpio (solo M)
- [ ] ✅ Verificado en nueva PC que funciona
- [ ] ✅ Imágenes muestran correctamente en órdenes
- [ ] ✅ Backend responde a `/api/v1/health`
- [ ] ✅ Frontend carga en localhost:5173

---

## 🔐 NOTAS DE SEGURIDAD

1. **NUNCA subir .env** — Siempre usar `.env.example`
2. **NUNCA subir logs/** — Generados en runtime
3. **NUNCA subir node_modules/** — Se regeneran con `npm install`
4. **NUNCA subir __pycache__/** — Se genera en runtime
5. **NUNCA subir uploads/** — Puede contener datos sensibles (usar volumen Docker)

---

## ❌ ERRORES COMUNES A EVITAR

❌ **No hacer:** `git push` sin verificar en otra PC  
✅ **Hacer:** Clonar y testar antes de subir

❌ **No hacer:** Subir `.env` con secretos  
✅ **Hacer:** Usar solo `.env.example`

❌ **No hacer:** Dejar archivos temporales/prueba  
✅ **Hacer:** Cleanup antes de commit

---

## 📞 SOPORTE

Si algo falla en la nueva PC:

1. Verificar que Docker está instalado
2. Verificar que `.env` está configurado correctamente
3. Verificar logs: `docker-compose logs be`
4. Verificar que los puertos 5432, 8000, 5173 NO están en uso

---

**Listo para producción ✅**

