// ════════════════════════════════════════
// 📄 Servicio API para tipos de documentos
// ════════════════════════════════════════

import api from '@/services/axios';
import { TypeDocument } from '@/types/auth';

export async function getTypeDocuments(): Promise<TypeDocument[]> {
  const response = await api.get<TypeDocument[]>('/api/v1/document-types');
  return response.data;
}

export async function getTypeDocument(id: string): Promise<TypeDocument> {
  const response = await api.get<TypeDocument>(`/api/v1/document-types/${id}`);
  return response.data;
}
