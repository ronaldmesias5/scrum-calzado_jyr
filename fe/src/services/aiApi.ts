// ════════════════════════════════════════
// 📄 Cliente HTTP para asistente IA (Fase 1 RAG + Fase 2 contexto por rol + Fase 3 avanzado)
// ════════════════════════════════════════

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

// ──────────────────────────────────────────────────────────────
// Fase 3 — Búsqueda semántica, recomendador, generador, clasificador
// ──────────────────────────────────────────────────────────────

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

export interface GenerateDescriptionRequest {
  product_id: string;
  tone?: string;
  max_length?: number;
}

export interface GenerateDescriptionResponse {
  product_id: string;
  generated_description: string;
  model: string;
}

export interface ClassifyIncidenceRequest {
  text: string;
}

export interface ClassifyIncidenceResponse {
  category: string;
  confidence: number;
  suggested_defect_code: string | null;
  reasoning: string;
}

export async function semanticSearch(q: string, k = 10): Promise<SemanticSearchResponse> {
  const response = await api.get<SemanticSearchResponse>(`${AI_PREFIX}/search/semantic`, { params: { q, k } });
  return response.data;
}

export async function recommend(productId: string, k = 5): Promise<RecommendResponse> {
  const response = await api.get<RecommendResponse>(`${AI_PREFIX}/recommend`, { params: { product_id: productId, k } });
  return response.data;
}

export async function generateDescription(data: GenerateDescriptionRequest): Promise<GenerateDescriptionResponse> {
  const response = await api.post<GenerateDescriptionResponse>(`${AI_PREFIX}/generate-description`, data);
  return response.data;
}

export async function classifyIncidence(data: ClassifyIncidenceRequest): Promise<ClassifyIncidenceResponse> {
  const response = await api.post<ClassifyIncidenceResponse>(`${AI_PREFIX}/classify-incidence`, data);
  return response.data;
}
