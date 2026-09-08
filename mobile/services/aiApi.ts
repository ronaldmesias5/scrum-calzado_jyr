/**
 * Archivo: mobile/services/aiApi.ts
 * Descripción: Cliente HTTP para asistente IA (Fase 2, mobile).
 *
 * ¿Qué?
 *   - postChat(message): POST /api/v1/ai/chat (JWT opcional vía apiClient interceptor)
 *   - getHealth(): GET /api/v1/ai/health
 *
 * ¿Para qué?
 *   - ChatWidget mobile (Fase 2) con SecureStore (tokenStorage).
 *
 * ¿Impacto?
 *   Fase 2 — sin este servicio no hay chat mobile. Si falla:
 *   - ChatWidget mobile → error de red.
 *   Dependencias: services/apiClient.ts (inyecta Bearer), constants/api.ts
 */

import { apiClient } from '@/services/apiClient';

const AI_PREFIX = '/ai';

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

export async function postChat(data: ChatRequest): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>(`${AI_PREFIX}/chat`, data);
  return response.data;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>(`${AI_PREFIX}/health`);
  return response.data;
}
