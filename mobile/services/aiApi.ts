// ════════════════════════════════════════
// 📄 Cliente HTTP para asistente IA (Fase 2 mobile + Fase 3 avanzado)
// ════════════════════════════════════════

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

export interface SemanticSearchResponse {
  query: string;
  results: SourceItem[];
  total: number;
}

export interface RecommendResponse {
  product_id: string;
  recommendations: SourceItem[];
  total: number;
}

export async function semanticSearch(q: string, k = 10): Promise<SemanticSearchResponse> {
  const response = await apiClient.get<SemanticSearchResponse>(`${AI_PREFIX}/search/semantic`, { params: { q, k } });
  return response.data;
}

export async function recommend(productId: string, k = 5): Promise<RecommendResponse> {
  const response = await apiClient.get<RecommendResponse>(`${AI_PREFIX}/recommend`, { params: { product_id: productId, k } });
  return response.data;
}

export async function generateDescription(data: { product_id: string; tone?: string; max_length?: number }): Promise<{ product_id: string; generated_description: string; model: string }> {
  const response = await apiClient.post(`${AI_PREFIX}/generate-description`, data);
  return response.data;
}

export async function classifyIncidence(data: { text: string }): Promise<{ category: string; confidence: number; suggested_defect_code: string | null; reasoning: string }> {
  const response = await apiClient.post(`${AI_PREFIX}/classify-incidence`, data);
  return response.data;
}
