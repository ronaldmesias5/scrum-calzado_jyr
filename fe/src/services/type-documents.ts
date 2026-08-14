/**
 * Archivo: api/type-documents.ts
 * Descripción: Servicio API para tipos de documentos.
 * ¿Para qué? Obtener la lista de tipos de documentos disponibles.
 */

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
