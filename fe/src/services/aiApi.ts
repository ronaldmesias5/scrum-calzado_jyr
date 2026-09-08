/**
 * Archivo: fe/src/services/aiApi.ts
 * Descripción: Cliente HTTP para asistente IA (Fase 1, RAG).
 *
 * ¿Qué?
 *   - postChat(message): POST /api/v1/ai/chat (público, 500 chars, rate limit 10/min)
 *   - getHealth(): GET /api/v1/ai/health
 *   - reindexEmbeddings(): POST /api/v1/ai/embeddings/reindex (solo jefe)
 *
 * ¿Para qué?
 *   - ChatWidget en LandingPage (Fase 1) y layouts autenticados (Fase 2).
 *   - Health para monitoreo.
 *   - Reindex para que el jefe actualice RAG tras crear productos.
 *
 * ¿Impacto?
 *   Fase 1 — sin este servicio no hay chat. Si falla:
 *   - ChatWidget → error de red.
 *   Modificar firmas rompe: useChat.ts, ChatWidget.tsx.
 *   Dependencias: services/axios.ts, services/config.ts
 */

import api from '@/services/axios';

const AI_PREFIX = '/api/v1/ai';

export interface ChatRequest {
  message: string;
}

export interface SourceItem {
  content: string;
  metadata?: Record<string, unknown> | null;
  score?: number | null;
}

export interface ChatResponse {
  answer: string;
  sources: SourceItem[];
  suggested_products: Array<{ content: string; metadata?: Record<string, unknown> | null }>;
}

export interface HealthResponse {
  status: string;
  provider: string;
  model: string;
  embeddings_count: number;
  ai_enabled: boolean;
}

export interface ReindexResponse {
  status: string;
  indexed: number;
  message: string;
}

export async function postChat(data: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>(`${AI_PREFIX}/chat`, data);
  return response.data;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>(`${AI_PREFIX}/health`);
  return response.data;
}

export async function reindexEmbeddings(): Promise<ReindexResponse> {
  const response = await api.post<ReindexResponse>(`${AI_PREFIX}/embeddings/reindex`);
  return response.data;
}
