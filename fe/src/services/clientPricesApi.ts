/**
 * Service: clientPricesApi.ts
 * Endpoints para gestión de precios personalizados por cliente.
 */

import api from '@/services/axios';

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export interface ClientPrice {
  id: string;
  client_id: string;
  client_name?: string;
  client_email?: string;
  product_id: string;
  product_name?: string;
  unit_price: number;
  created_at?: string;
}

export interface ClientPriceCreateRequest {
  client_id: string;
  product_id: string;
  unit_price: number;
}

export interface ClientPriceBulkRequest {
  client_id: string;
  prices: Array<{ product_id: string; unit_price: number }>;
}

// ─────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────

const BASE = '/api/v1/admin/client-prices';

/**
 * Lista precios personalizados, opcionalmente filtrados por cliente.
 */
export async function listClientPrices(
  clientId?: string
): Promise<ClientPrice[]> {
  const params: Record<string, string> = {};
  if (clientId) params.client_id = clientId;
  const { data } = await api.get<ClientPrice[]>(BASE, { params });
  return data;
}

/**
 * Crea o actualiza un precio personalizado (upsert por client_id + product_id).
 */
export async function createOrUpdateClientPrice(
  payload: ClientPriceCreateRequest
): Promise<ClientPrice> {
  const { data } = await api.post<ClientPrice>(BASE, payload);
  return data;
}

/**
 * Actualiza el precio de un registro existente por ID.
 */
export async function updateClientPrice(
  priceId: string,
  unitPrice: number
): Promise<ClientPrice> {
  const { data } = await api.put<ClientPrice>(`${BASE}/${priceId}`, {
    unit_price: unitPrice
  });
  return data;
}

/**
 * Elimina (soft delete) un registro de precio personalizado.
 */
export async function deleteClientPrice(priceId: string): Promise<void> {
  await api.delete(`${BASE}/${priceId}`);
}

/**
 * Asigna precios en lote para un cliente.
 */
export async function bulkUpsertClientPrices(
  payload: ClientPriceBulkRequest
): Promise<ClientPrice[]> {
  const { data } = await api.post<ClientPrice[]>(`${BASE}/bulk`, payload);
  return data;
}
