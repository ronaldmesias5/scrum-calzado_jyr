# Águila J&R 🦅 — Funcionalidades de IA por Rol

> **Asistente:** Águila J&R — Calzado J&R | **Stack:** FastAPI + pgvector + Groq (`openai/gpt-oss-20b`) + RAG 38 fragmentos | **Versión:** Fase 0-4 (Sept 2026)
> **Acceso:** FAB abajo-izquierda (gradiente azul→ámbar, Bot + Sparkles, badge IA/1, tooltip) en `LandingPage` + `AdminLayout` + `ClientLayout` + `EmployeeLayout` + `AppLayout` + `mobile`

---

## Índice
1. [Cómo usar Águila J&R](#1-cómo-usar-águila-jr)
2. [Reglas comunes (todos los roles)](#2-reglas-comunes-todos-los-roles)
3. [Visitante (sin login)](#3-visitante-sin-login)
4. [Cliente](#4-cliente)
5. [Empleado](#5-empleado)
6. [Jefe / Admin](#6-jefe--admin)
7. [Tabla comparativa por rol](#7-tabla-comparativa-por-rol)
8. [Prompts listos para copiar y pegar](#8-prompts-listos-para-copiar-y-pegar)
9. [Fase 3 — Funciones avanzadas por rol](#9-fase-3--funciones-avanzadas-por-rol)
10. [Endpoints técnicos por rol](#10-endpoints-técnicos-por-rol)
11. [Limitaciones y buenas prácticas](#11-limitaciones-y-buenas-prácticas)
12. [FAQ](#12-faq)

---

## 1. Cómo usar Águila J&R

**Dónde está:**
- **Web:** FAB fijo abajo-izquierda en todas las páginas (landing + dashboards). Opuesto a WhatsApp (derecha).
- **Mobile:** `mobile/components/ChatWidget.tsx` — mismo FAB con `apiClient` + `SecureStore`.

**Cómo abrir:**
- Click en FAB (Bot + Sparkles, punto verde "en línea", badge `1` la primera vez, `IA` después).
- Tooltip invitación aparece a los 2s: `¡Hola! Soy Águila J&R 🦅 — Pregúntame por tallas, marcas o pedidos` + `Chatear ahora →`. Se oculta al abrir, al chatear, tras 8s o con X. No molesta si ya interactuaste (`localStorage aguila_interacted`).
- Label desktop `¿Necesitas ayuda?` (punto verde pulsante) cuando no hay tooltip ni interacción previa.
- Panel 380×500px: header `Águila J&R · Asistente IA` (gradiente), historial, typing indicator, input 500 chars, `Enter` para enviar, `Escape` para cerrar, `🗑️` para limpiar.

**Autenticación:**
- Sin login → visitante (solo catálogo + FAQs, sin datos privados).
- Con login → JWT se envía automático vía `axios` interceptor (`Authorization: Bearer`). El chat añade contexto por rol (pedidos/tareas/productos) sin que hagas nada.

---

## 2. Reglas comunes (todos los roles)

| Regla | Detalle |
|---|---|
| **Solo catálogo + FAQs** | Responde solo con `ai_embeddings` (5 brands, 3 categorías, 22 estilos, 8 FAQs). Si no sabe, deriva a WhatsApp `573001234567`. |
| **Nunca inventa** | No inventa tallas, precios, stock, modelos o disponibilidad. |
| **Tono** | Amable, conciso, colombiano, máx 4 frases salvo que pidas detalle. Se presenta como `Águila J&R 🦅`. |
| **Validación** | 1-500 chars, anti prompt-injection (`ignore previous instructions`, `system:`, `jailbreak` → 422), rate limit 10/min por IP → 429. |
| **Idioma** | Español. |
| **Privacidad** | Sin JWT no expone pedidos/tareas. Con JWT solo ve tus datos (cliente ve sus pedidos, empleado sus tareas). |

**System prompt (resumen):**
> Eres Águila J&R 🦅, experto en calzado mayorista colombiano. Responde solo con catálogo/FAQs del contexto. Si no sabes, deriva a WhatsApp 573001234567. Nunca inventes. Tono amable, conciso, colombiano.

---

## 3. Visitante (sin login)

**Quién es:** Cualquier persona en `http://localhost:5173` sin iniciar sesión.

**Qué puede hacer Águila:**
- Explicar catálogo: marcas, categorías, estilos, tallas, colores.
- Explicar cómo ser cliente mayorista (RF-001).
- Explicar pedidos mayoristas, envíos, contacto.
- Buscar productos por texto (si pregunta con `producto, zapato, bota, tenis, marca, talla, color` → añade 3 productos al contexto).

**Qué NO puede:**
- Ver pedidos o tareas (responde `Inicia sesión para consultar pedidos` o `No tienes pedidos registrados` sin JWT).
- Reindexar, generar descripciones, clasificar incidencias (requieren auth).

**Ejemplos para visitante (copiar y pegar):**
```
¿Qué marcas manejan?
¿Qué categorías tienen?
¿Qué tallas manejan?
¿Tienen botas talla 42?
¿Tienen Nike Air Max?
¿Tienen Reebok Princesa en Caballero?
¿Cómo ser cliente mayorista?
¿Cómo hago un pedido mayorista?
¿Qué es el catálogo mayorista?
¿Hacen envíos a todo Colombia?
¿Cómo contacto a Calzado J&R?
Busca bota talla 42 negra
¿Venden sombreros?  → deriva a WhatsApp
```

**Flujo RF-001 (registro mayorista):**
> Regístrate en la landing con correo, nombre, teléfono y NIT. El jefe valida tu cuenta y te da acceso al catálogo mayorista. Luego inicias sesión y haces pedidos desde tu dashboard cliente.

---

## 4. Cliente

**Quién es:** `role=client` (ej: cliente mayorista validado). Login vía landing.

**Todo lo de visitante +:**

**Pedidos (con JWT):**
- `¿Dónde va mi pedido?` / `Muéstrame mis pedidos` / `¿Cuántos pedidos tengo pendientes?`
- Consulta `orders` donde `customer_id == tu id` (máx 5, ordenados por `creation_date` desc).
- Responde con `id_short` (8 chars), `estado` (`pendiente`, `en_progreso`, `completado`, `entregado`, `cancelado`), `total_pairs`, `delivery_date`, `details_count`.
- Si no tienes pedidos: `No tienes pedidos registrados.`
- Si pides pedido de otro cliente: no lo ve (filtro por `customer_id`).

**Productos:**
- `Busca bota talla 42 negra` → busca en `products` vía `ILIKE` (name, description, color) y añade 3 productos al contexto.

**Fase 3 (si está en `develop`):**
- `GET /api/v1/ai/search/semantic?q=bota antideslizante talla 42` → búsqueda semántica en `ai_embeddings` (público, sin auth, q 2-200, k 1-20).
- `GET /api/v1/ai/recommend?product_id=UUID` → recomienda productos similares (filtra `source==product`, excluye base, solo activos).

**Ejemplos para cliente:**
```
¿Dónde va mi pedido?
Muéstrame mis pedidos
¿Mi pedido #a1b2c3d4 está en producción?
Busca Nike Air Force One talla 40
¿Tienen Puma California en Dama?
Recomiéndame productos similares a [UUID de producto]
Búsqueda semántica: bota antideslizante talla 42
```

**Tip:** Para `recommend`, copia `product_id` del catálogo mayorista (UUID).

---

## 5. Empleado

**Quién es:** `role=employee` con `occupation` en `jefe, cortador, guarnecedor, solador, emplantillador`. Login vía admin.

**Todo lo de visitante +:**

**Tareas (con JWT):**
- `¿Qué tareas tengo?` / `¿Qué vales tengo pendientes?` / `¿Qué tareas tengo en producción?`
- Consulta `tasks` donde `assigned_to == tu id` (máx 5, orden por `assignment_date` desc).
- Responde con `id_short`, `type` (`corte`, `guarnicion`, `soladura`, `emplantillado`), `status` (`pendiente`, `por_liquidar`, `en_progreso`, `completado`, `pagado`, `cancelado`), `priority` (`baja`, `alta`), `amount` (pares), `deadline`, `description` (100 chars).
- Si no tienes tareas: `No tienes tareas asignadas.`

**Productos:**
- Igual que cliente (búsqueda por texto).

**Fase 3:**
- `POST /api/v1/ai/classify-incidence` (autenticado, 10-1000 chars) → clasifica texto en `falla, faltante, perdida, en_reparacion, devuelto, otro` + `confidence` 0-1 + `suggested_defect_code` (`DEF-FAB`, `DEF-ALM`, `DEF-PRO`, `DEF-DEV`, `DEV-CLT`, `ENR-REP`) + `reasoning`. Usa LLM si hay `AI_API_KEY`, fallback a reglas si no.
- `GET /search/semantic` y `GET /recommend` (públicos).

**Ejemplos para empleado:**
```
¿Qué tareas tengo hoy?
¿Qué vales tengo pendientes?
Muéstrame mis tareas de corte
¿Tengo tareas por liquidar?
Clasifica esta incidencia: La máquina de coser se dañó y no cose bien el cuero
Clasifica: Falta cuero negro para 20 pares
Búsqueda semántica: guarnición talla 38
```

**Por ocupación:**
- **Cortador:** `¿Qué tareas de corte tengo?`
- **Guarnecedor:** `¿Qué tareas de guarnición tengo?`
- **Solador:** `¿Qué tareas de soladura tengo?`
- **Emplantillador:** `¿Qué tareas de emplantillado tengo?`
- Todas responden con filtro por `type` si lo mencionas, o todas si no.

---

## 6. Jefe / Admin

**Quién es:** `role=admin` o `occupation=jefe` (ej: `ronald.jefe@gmail.com` / `Test123456!`). Tiene todo lo de cliente + empleado + extras.

**Todo lo de visitante + cliente + empleado +:**

**Pedidos y tareas:**
- Ve pedidos (como cliente) y tareas (como empleado) con el mismo formato.
- Puede preguntar `¿Dónde va mi pedido?` y `¿Qué tareas tengo?` y obtiene ambos.

**Reindex (solo jefe/admin):**
- `POST /api/v1/ai/embeddings/reindex` (requiere JWT + `_require_admin_or_jefe`) → borra `ai_embeddings` y reindexa 38 fragmentos (brands, categories, styles, FAQs) vía `scripts/seed_ai_embeddings.py`. Útil tras crear productos/marcas/estilos.
- En frontend: no hay botón aún, usar `curl` o futuro botón en `AdminLayout`.

**Fase 3 — Generador (solo jefe):**
- `POST /api/v1/ai/generate-description` (solo jefe, `product_id` UUID, `tone` en `profesional, casual, tecnico, vendedor`, `max_length` 50-500) → genera descripción vía LLM con datos del producto (nombre, marca, estilo, categoría, color, descripción actual, estado) + prompt por tono. Trunca a `max_length`. Si `product_id` no existe → 404, si UUID inválido → 422.
- Requiere que `products` tenga datos (actualmente 0 en dev, crear vía admin).

**Fase 3 — Clasificador y búsqueda:**
- `POST /classify-incidence` (autenticado, como empleado).
- `GET /search/semantic` y `GET /recommend` (públicos).

**Ejemplos para jefe:**
```
¿Dónde va mi pedido?
¿Qué tareas tengo?
Reindexa los embeddings  → POST /embeddings/reindex (con JWT jefe)
Genera descripción para producto [UUID] tono vendedor max 200
Genera descripción tono tecnico para [UUID]
Clasifica incidencia: La máquina de coser se dañó
Búsqueda semántica: bota talla 42 antideslizante
Recomienda productos similares a [UUID]
¿Qué marcas manejan?  → también funciona
```

**Comandos jefe (curl):**
```bash
# Login jefe
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"ronald.jefe@gmail.com","password":"Test123456!"}' | jq -r .access_token)

# Chat con contexto jefe
curl -s -X POST http://localhost:8000/api/v1/ai/chat -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"message":"¿Qué tareas tengo?"}' | jq

# Reindex
curl -s -X POST http://localhost:8000/api/v1/ai/embeddings/reindex -H "Authorization: Bearer $TOKEN" -H "X-CSRF-Token: $(curl -s -c - http://localhost:8000/api/v1/ai/health | grep csrf_token | awk '{print $7}')" -b cookies.txt | jq

# Generar descripción (requiere producto existente)
curl -s -X POST http://localhost:8000/api/v1/ai/generate-description -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -H "X-CSRF-Token: $CSRF" -b cookies.txt -d '{"product_id":"UUID","tone":"vendedor","max_length":200}' | jq

# Clasificar
curl -s -X POST http://localhost:8000/api/v1/ai/classify-incidence -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -H "X-CSRF-Token: $CSRF" -b cookies.txt -d '{"text":"La máquina de coser se dañó y no cose bien el cuero, falla de maquinaria"}' | jq

# Búsqueda semántica (pública, sin JWT)
curl -s "http://localhost:8000/api/v1/ai/search/semantic?q=bota%20talla%2042&k=3" | jq
```

---

## 7. Tabla comparativa por rol

| Funcionalidad | Visitante | Cliente | Empleado | Jefe/Admin | Auth | Endpoint |
|---|---:|---|---|---|---|---|
| **Chat catálogo + FAQs** | ✅ | ✅ | ✅ | ✅ | No | `POST /chat` |
| **Ver mis pedidos** | ❌ | ✅ | ❌ | ✅ | JWT | `POST /chat` + `consultar_mis_pedidos` |
| **Ver mis tareas** | ❌ | ❌ | ✅ | ✅ | JWT | `POST /chat` + `consultar_mis_tareas` |
| **Buscar productos por texto** | ✅ | ✅ | ✅ | ✅ | No/JWT | `POST /chat` + `buscar_productos` |
| **Búsqueda semántica** | ✅ | ✅ | ✅ | ✅ | No | `GET /search/semantic` |
| **Recomendador** | ✅ | ✅ | ✅ | ✅ | No | `GET /recommend` |
| **Generar descripción** | ❌ | ❌ | ❌ | ✅ | JWT jefe | `POST /generate-description` |
| **Clasificar incidencia** | ❌ | ❌ | ✅ | ✅ | JWT | `POST /classify-incidence` |
| **Reindex embeddings** | ❌ | ❌ | ❌ | ✅ | JWT jefe | `POST /embeddings/reindex` |
| **Health check** | ✅ | ✅ | ✅ | ✅ | No | `GET /health` |
| **Mobile ChatWidget** | ✅ | ✅ | ✅ | ✅ | JWT opcional | `mobile/services/aiApi.ts` |

---

## 8. Prompts listos para copiar y pegar

**Visitante:**
```
¿Qué marcas manejan?
¿Qué categorías tienen?
¿Qué tallas manejan?
¿Tienen botas talla 42?
¿Tienen Nike Air Max talla 40?
¿Cómo ser cliente mayorista?
¿Cómo hago un pedido mayorista?
¿Hacen envíos a todo Colombia?
¿Cómo contacto a Calzado J&R?
```

**Cliente:**
```
¿Dónde va mi pedido?
Muéstrame mis pedidos
¿Mi pedido está en producción?
Busca Puma California en Dama
¿Tienen Reebok Princesa en Infantil?
Búsqueda semántica: bota antideslizante talla 42
Recomienda productos similares a 00000000-0000-0000-0000-000000000001
```

**Empleado:**
```
¿Qué tareas tengo hoy?
¿Qué vales tengo pendientes?
Muéstrame mis tareas de corte
¿Tengo tareas por liquidar?
Clasifica esta incidencia: Falta cuero negro para 20 pares
Clasifica: La máquina de coser se dañó
```

**Jefe:**
```
¿Qué tareas tengo?
¿Dónde va mi pedido?
Genera descripción para producto UUID tono vendedor max 200
Clasifica incidencia: La máquina de coser se dañó y no cose bien el cuero
Búsqueda semántica: guarnición talla 38
Reindexa los embeddings
```

---

## 9. Fase 3 — Funciones avanzadas por rol

### 9.1 Búsqueda semántica `GET /api/v1/ai/search/semantic`
- **Para:** Todos (público, sin auth, CSRF exento).
- **Query:** `q` 2-200 chars, `k` 1-20 (default 10).
- **Qué hace:** `search_similar` en `ai_embeddings` por distancia coseno (pgvector) o `ILIKE` fallback. Retorna `query, results[{content, metadata, score}], total`.
- **Ejemplo:** `q=bota talla 42` → `tallas` (0.72), `pedidos` (0.78), `Bota Clásica Reebok` (0.79).
- **Frontend:** `fe/src/services/aiApi.ts: semanticSearch(q, k)` + `mobile/services/aiApi.ts`.

### 9.2 Recomendador `GET /api/v1/ai/recommend`
- **Para:** Todos (público, sin auth, CSRF exento).
- **Params:** `product_id` UUID, `k` 1-10 (default 5).
- **Qué hace:** Busca embedding base por `metadata.product_id`, luego `search_similar` con `base.content`, filtra `source==product`, excluye base, retorna `product_id, recommendations, total`. Si no hay productos (0 en dev) → `[]`.
- **Validación:** UUID inválido → 422.

### 9.3 Generador `POST /api/v1/ai/generate-description`
- **Para:** Solo jefe/admin (JWT + `_require_admin_or_jefe`).
- **Body:** `product_id` UUID, `tone` en `profesional, casual, tecnico, vendedor` (default `profesional`), `max_length` 50-500 (default 200).
- **Qué hace:** Lee `Product` + `Brand`/`Category`/`Style`, arma prompt por tono, llama `call_llm`, trunca a `max_length`. Retorna `product_id, generated_description, model`.
- **Errores:** UUID inválido → 422, producto no existe → 404, sin permisos → 403.

### 9.4 Clasificador `POST /api/v1/ai/classify-incidence`
- **Para:** Autenticado (cualquier rol con JWT, CSRF requerido).
- **Body:** `text` 10-1000 chars.
- **Qué hace:** Si `AI_API_KEY` vacío → reglas (`máquina/falla` → `falla` 0.6 `DEF-FAB`, `faltante/insumo` → `faltante` 0.6, `pérdida` → `perdida` 0.6, otro → `otro` 0.5). Si hay LLM → prompt JSON `category, confidence, suggested_defect_code, reasoning`, parsea JSON, fallback a reglas si falla. Retorna `category` en `falla, faltante, perdida, en_reparacion, devuelto, otro`, `confidence` 0-1, `suggested_defect_code`, `reasoning`.
- **Ejemplo:** `La máquina de coser se dañó` → `falla 0.95 DEF-ALM`.

---

## 10. Endpoints técnicos por rol

| Método | Ruta | Rol | Auth | CSRF | Validación |
|---|---|---|---|---|---|
| `POST` | `/api/v1/ai/chat` | Todos | JWT opcional | Exento | `message` 1-500, anti injection, 10/min |
| `GET` | `/api/v1/ai/health` | Todos | No | Exento | — |
| `POST` | `/api/v1/ai/embeddings/reindex` | Jefe/Admin | JWT jefe | Sí | — |
| `GET` | `/api/v1/ai/search/semantic` | Todos | No | Exento | `q` 2-200, `k` 1-20 |
| `GET` | `/api/v1/ai/recommend` | Todos | No | Exento | `product_id` UUID, `k` 1-10 |
| `POST` | `/api/v1/ai/generate-description` | Jefe/Admin | JWT jefe | Sí | `product_id` UUID, `tone`, `max_length` 50-500 |
| `POST` | `/api/v1/ai/classify-incidence` | Autenticado | JWT | Sí | `text` 10-1000 |

**Base URL:** `http://localhost:8000` (dev) o `https://tu-dominio.com` (prod, `docker-compose.prod.yml` con `nginx` + `certbot`).

**Mobile base:** `http://<IP_LAN>:8000/api/v1` (Expo `hostUri`) o `EXPO_PUBLIC_API_URL`.

---

## 11. Limitaciones y buenas prácticas

**Limitaciones:**
- 500 chars por mensaje, 10 req/min por IP, 1000 chars para clasificar, 200 chars para `q` semántica.
- Sin productos en BD (0 en dev) → `recommend` y `generate-description` vacíos/404 hasta crear productos vía admin.
- Embeddings hash determinístico (no semántico real) — para semántica real, Fase 3 TODO: `nomic-embed-text` vía Ollama (`AI_PROVIDER=ollama`, `docker compose --profile ollama up -d`, `ollama pull llama3.2:3b`, 8GB RAM).
- `ai_embeddings` 38 fragmentos (5 brands, 3 categories, 22 styles, 8 FAQs) — reindex tras crear productos.

**Buenas prácticas:**
- Sé específico: `¿Tienen Nike Air Max talla 42 en Dama?` mejor que `¿Tienen zapatos?`.
- Usa palabras clave para activar tools: `pedido, orden, tarea, vale, producción, producto, zapato, bota, marca, talla, color`.
- Para jefe: crea productos primero, luego `POST /reindex` para que RAG los vea.
- Si `AI_API_KEY` vacío → mock (sin costo, sin LLM, respuestas basadas en `top_content`).
- Logs: `be/logs/ai.log` (Fase 4, `ai_logger` en `ai_service.py` + `ai_chat.py`).

**Costos:**
- Groq `openai/gpt-oss-20b` 14.400 req/día gratis, sin tarjeta. 100 chats/día = 3k/mes << límite. Embeddings hash $0. `pgvector` + widget $0. Solo pagarías si >400 chats/día (~$1-5/mes).

---

## 12. FAQ

**¿Puedo saltarme Fase 0?** No. Sin `pgvector`, Fase 1 falla (`extension vector does not exist`).

**¿Necesito saber de IA?** No. Solo `system_prompt.txt` + `seed_ai_embeddings.py`. RAG es `embed + search + prompt`.

**¿Si Groq se cae?** Cambia `.env` a `AI_PROVIDER=gemini` + `AI_API_KEY` de https://aistudio.google.com/app/apikey + `AI_MODEL=gemini-2.0-flash` y `docker compose restart be`.

**¿Y si quiero $0 para siempre sin Groq?** `AI_PROVIDER=ollama`, `docker compose --profile ollama up -d`, `docker compose --profile ollama exec ollama ollama pull llama3.2:3b`, 8GB RAM, 2-5s por respuesta.

**¿Por qué Águila J&R?** Animal del logo (águila) + J&R. Alternativas: `Águila Calzado`, `J&R Águila IA`, `Águila Mayorista`, `Águila 360`, `Águila Guardián`.

**¿Dónde está el código?**
- Backend: `be/app/schemas/ai.py`, `be/app/services/ai_service.py`, `be/app/services/ai_tools.py`, `be/app/routers/ai_chat.py`, `be/app/services/prompts/system_prompt.txt`, `be/scripts/seed_ai_embeddings.py`, `be/app/models/ai_embedding.py`, `be/alembic/versions/048*`, `be/app/config.py` (`AI_*`), `be/app/middleware/csrf.py`, `be/app/logging_config.py` (`ai.log`).
- Frontend: `fe/src/features/ai/components/organisms/ChatWidget.tsx`, `fe/src/services/aiApi.ts`, `fe/src/hooks/useChat.ts`, `fe/src/pages/public/LandingPage.tsx`, `fe/src/features/admin|client|employee/components/organisms/*Layout.tsx`, `fe/src/components/layout/AppLayout.tsx`.
- Mobile: `mobile/components/ChatWidget.tsx`, `mobile/services/aiApi.ts`.
- Infra: `docker-compose.yml` + `docker-compose.prod.yml` (`pgvector/pgvector:pg17`, `ollama` profile), `.github/workflows/ci.yml` (`pgvector/pgvector:pg16`), `db/init/init.sql` (`CREATE EXTENSION vector`), `.env.example` (`AI_*`).

**¿Cómo pruebo como cada rol?**
- Visitante: sin login, `curl -X POST http://localhost:8000/api/v1/ai/chat -H "Content-Type: application/json" -d '{"message":"¿Qué marcas manejan?"}'`
- Cliente/Empleado/Jefe: login primero, luego `curl -H "Authorization: Bearer $TOKEN" -d '{"message":"¿Dónde va mi pedido?"}'`

---

*Calzado J&R — FastAPI + React 19 + PostgreSQL 17 + pgvector — Sept 2026 — Águila J&R 🦅*
