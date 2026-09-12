# IA Bot — Águila J&R 🦅

> **Carpeta:** `docs/IA_BOT/` — Documentación y conocimiento del asistente IA de Calzado J&R.
> **Asistente:** Águila J&R — Calzado J&R | **Stack:** FastAPI + PostgreSQL 17 + pgvector + Groq (`openai/gpt-oss-20b`) + RAG | **Versión:** Fase 0-4 (Sept 2026)

---

## Qué hay en esta carpeta

| Archivo | Para qué | Quién lo usa |
|---|---|---|
| `knowledge.md` | **Fuente de verdad del RAG.** Flujos completos por rol (visitante, cliente, empleado por cargo, jefe), reglas de negocio, glosario, rutas exactas, límites y permisos. | `be/scripts/seed_ai_embeddings.py` lo lee, lo trocea en chunks <700 chars y lo indexa en `ai_embeddings` con `metadata.source=knowledge`. |
| `README.md` | Este archivo. Explica la carpeta y cómo se implementó la IA. | Humanos (SENA, devs). |

> **Nota:** Antes había 4 archivos (`CONOCIMIENTO_SISTEMA_PARA_IA.md`, `FUNCIONALIDADES_POR_ROL.md`, `GUIA_IMPLEMENTACION_IA.md`, `PLAN_FASES_IA.md`). Se consolidó en `knowledge.md` como única fuente RAG para simplificar. La guía por rol y el plan de fases viven ahora en `knowledge.md` y en este README.

---

## Cómo se implementó la IA

### Arquitectura

```
Usuario (web/mobile)
  → ChatWidget FAB (abajo-izquierda en landing, abajo-derecha en dashboards)
  → POST /api/v1/ai/chat {message} (JWT opcional vía axios interceptor)
  → be/app/services/ai_service.py
      → get_embedding(query) → vector 768 dims hash determinístico $0 (normalizado L2)
      → search_similar (pgvector cosine distance top 5, fallback ILIKE)
      → format_tool_context (si hay JWT: get_user_context + consultar_mis_pedidos/tareas/buscar_productos según rol)
      → build_prompt (system_prompt.txt + contextos RAG + contexto por rol)
      → call_llm (Groq openai/gpt-oss-20b vía openai SDK, fallback mock si no hay AI_API_KEY)
  → {answer, sources, suggested_products}
```

**No es fine-tuning, es RAG (Retrieval Augmented Generation):** recupera conocimiento y se lo pasa al LLM. El conocimiento es estático hasta reindexar.

### Stack

| Capa | Tecnología | Detalle |
|---|---|---|
| **BD** | `pgvector/pgvector:pg17` | Extensión `vector`, tabla `ai_embeddings(id uuid, content text, embedding vector(768), metadata jsonb, created_at)`, índice HNSW `vector_cosine_ops`, migración `048` |
| **Embeddings** | Hash SHA256 determinístico 768 dims | `$0`, sin API, normalizado L2. Reemplazable por `nomic-embed-text` vía Ollama sin cambiar interfaz |
| **LLM** | Groq `openai/gpt-oss-20b` | Vía `openai` SDK `base_url=https://api.groq.com/openai/v1`, 14.400 req/día gratis. Fallback mock si `AI_API_KEY` vacío. Alternativas: `gemini`, `ollama`, `openai` vía `AI_PROVIDER` |
| **Backend** | FastAPI | `be/app/schemas/ai.py` (500 chars, anti injection, 10/min), `be/app/services/ai_service.py`, `be/app/services/ai_tools.py`, `be/app/routers/ai_chat.py`, `be/app/services/prompts/system_prompt.txt` |
| **Frontend** | React 19 | `fe/src/features/ai/components/organisms/ChatWidget.tsx` (FAB + panel 380×500, tooltip, badge IA/1, label ayuda, position left/right), `fe/src/services/aiApi.ts`, `fe/src/hooks/useChat.ts` |
| **Mobile** | Expo | `mobile/components/ChatWidget.tsx` + `mobile/services/aiApi.ts` (apiClient + SecureStore) |
| **Infra** | Docker Compose | `pgvector/pgvector:pg17` en `docker-compose.yml` + `docker-compose.prod.yml`, `pgvector/pgvector:pg16` en CI, `ollama` opcional con `--profile ollama`, `docker-compose.yml` monta `./docs:/app/docs:ro` para que el seed lea `knowledge.md` |

### Fases

| Fase | Qué | Estado |
|---|---|---|
| **0** | Infra pgvector + `ai_embeddings` + `AI_*` config | ✅ |
| **1** | MVP ChatWidget + RAG + Groq (público, 38 fragmentos) | ✅ |
| **2** | Contexto por rol + tools JWT + layouts + mobile | ✅ |
| **3** | Búsqueda semántica `GET /search/semantic`, recomendador `GET /recommend`, generador `POST /generate-description` (solo jefe), clasificador `POST /classify-incidence` | ✅ |
| **4** | Prod hardening + ollama + logging `ai.log` + CI | ✅ |
| **Conocimiento total** | 110 fragmentos (30 catálogo + 8 base + 36 por rol + 36 knowledge) | ✅ |

### Flujo de conocimiento

1. **Fuentes:** `knowledge.md` (flujos por rol, reglas, glosario, rutas) + `BASE_FAQS` (8) + `ROLE_FAQS` (36) + catálogo BD (30: 5 brands, 3 categories, 22 styles)
2. **Indexación:** `docker compose exec be uv run python scripts/seed_ai_embeddings.py` → lee `knowledge.md`, trocea por `##` en chunks <700 chars, `get_embedding` → `ai_embeddings` con `metadata={source, topic, roles, section}`. Idempotente (borra antes). También vía `POST /api/v1/ai/embeddings/reindex` (solo jefe).
3. **Consulta:** Cada `POST /chat` → `get_embedding(query)` → `search_similar` top 5 → `format_tool_context` si hay JWT → `build_prompt` → `call_llm` → respuesta con `sources`.
4. **Actualización:** Si cambia `knowledge.md` o el catálogo, ejecutar seed de nuevo y `docker compose restart be`.

### Roles y permisos

| Rol | Qué ve Águila | Qué NO ve |
|---|---|---|
| **Visitante** (sin login) | Catálogo público, cómo registrarse (RF-001), FAQs, contacto | Pedidos/tareas, precios internos |
| **Cliente** (`client`) | + Sus pedidos (`customer_id == id`), catálogo mayorista, incidencias | Pedidos de otros, inventario, empleados |
| **Empleado** (`employee` + `cortador|guarnecedor|solador|emplantillador`) | + Sus tareas (`assigned_to == id`, filtradas por cargo), vales, incidencias | Tareas de otros, gestión usuarios, catálogo |
| **Jefe** (`admin`+`jefe`) | Todo (pedidos, tareas, catálogo, inventario, reportes, reindex, generador) | Nada, pero no ejecuta acciones destructivas sin confirmación |

**Regla crítica:** El sistema NO tiene precio de venta. Solo `task_prices` (pago a empleados COP por docena por etapa). Si preguntan precio, deriva a WhatsApp `3137061602`.

### Endpoints

| Método | Ruta | Rol | Auth | CSRF |
|---|---|---|---|---|
| `POST` | `/api/v1/ai/chat` | Todos | JWT opcional | Exento |
| `GET` | `/api/v1/ai/health` | Todos | No | Exento |
| `POST` | `/api/v1/ai/embeddings/reindex` | Jefe/Admin | JWT jefe | Sí |
| `GET` | `/api/v1/ai/search/semantic` | Todos | No | Exento |
| `GET` | `/api/v1/ai/recommend` | Todos | No | Exento |
| `POST` | `/api/v1/ai/generate-description` | Jefe/Admin | JWT jefe | Sí |
| `POST` | `/api/v1/ai/classify-incidence` | Autenticado | JWT | Sí |

### Variables de entorno

```env
AI_PROVIDER=groq # groq | gemini | ollama | openai | disabled
AI_API_KEY=gsk_... # Groq https://console.groq.com/keys (sin tarjeta) o vacío = mock
AI_MODEL=openai/gpt-oss-20b
AI_EMBEDDING_MODEL=nomic-embed-text
AI_MAX_TOKENS=512
AI_EMBEDDING_DIM=768
```

### Comandos

```bash
# Indexar conocimiento
docker compose exec be uv run python scripts/seed_ai_embeddings.py # 110 fragmentos

# Probar
curl -X POST http://localhost:8000/api/v1/ai/chat -H "Content-Type: application/json" -d '{"message":"¿Qué marcas manejan?"}'
# Con JWT jefe
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"ronald.jefe@gmail.com","password":"Test123456!"}' | jq -r .access_token)
curl -X POST http://localhost:8000/api/v1/ai/chat -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"message":"como puedo realizar un pedido?"}'

# Verificación
docker compose exec be uv run ruff check app/services/ai_tools.py app/services/ai_service.py scripts/seed_ai_embeddings.py
docker compose exec be uv run pytest -q # 54 passed
```

### Archivos clave

- **Backend:** `be/app/schemas/ai.py`, `be/app/services/ai_service.py`, `be/app/services/ai_tools.py`, `be/app/routers/ai_chat.py`, `be/app/services/prompts/system_prompt.txt`, `be/scripts/seed_ai_embeddings.py`, `be/app/models/ai_embedding.py`, `be/alembic/versions/048*`, `be/app/config.py` (`AI_*`), `be/app/middleware/csrf.py`, `be/app/logging_config.py` (`ai.log`)
- **Frontend:** `fe/src/features/ai/components/organisms/ChatWidget.tsx`, `fe/src/services/aiApi.ts`, `fe/src/hooks/useChat.ts`, `fe/src/pages/public/LandingPage.tsx`, `fe/src/features/admin|client|employee/components/organisms/*Layout.tsx`, `fe/src/components/layout/AppLayout.tsx`
- **Mobile:** `mobile/components/ChatWidget.tsx`, `mobile/services/aiApi.ts`
- **Infra:** `docker-compose.yml` + `docker-compose.prod.yml` (`pgvector/pgvector:pg17`, `ollama` profile), `.github/workflows/ci.yml` (`pgvector/pgvector:pg16`), `db/init/init.sql` (`CREATE EXTENSION vector`), `.env.example` (`AI_*`)

---

*Calzado J&R — FastAPI + React 19 + PostgreSQL 17 + pgvector — Sept 2026 — Águila J&R 🦅*
