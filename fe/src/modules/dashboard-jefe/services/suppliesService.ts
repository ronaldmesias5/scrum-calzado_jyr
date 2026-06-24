/**
 * Archivo: fe/src/modules/dashboard-jefe/services/suppliesService.ts
 * Descripción: Servicio API para gestión de insumos de fabricación.
 */

import api from '@/api/axios';

export type SupplyCategory = string;

export interface LinkedProduct {
  product_id: string;
  product_name: string;
  quantity_required: number;
}

export interface Supply {
  id: string;
  name: string;
  description: string | null;
  category: string;
  color?: string;
  stock_quantity: number;
  sizes?: Record<string, number>;
  unit: string | null;
  created_at: string;
  linked_products: LinkedProduct[];
}

export interface SuppliesListResponse {
  items: Supply[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SupplyCreatePayload {
  name: string;
  category: string;
  color?: string;
  stock_quantity: number;
  sizes?: Record<string, number>;
  unit: string | null;
  description: string | null;
}

export interface SupplyUpdatePayload {
  name?: string;
  category?: string;
  color?: string;
  stock_quantity?: number;
  sizes?: Record<string, number>;
  unit?: string | null;
  description?: string | null;
}

export interface ProductSupplyCheck {
  supply_id: string;
  supply_name: string;
  supply_color?: string | null;
  supply_unit?: string | null;
  supply_category: string;
  global_stage?: string | null;
  quantity_required: number;
  stock_quantity: number;
  stock_sufficient: boolean;
}

export interface ProductSuppliesCheckResponse {
  product_id: string;
  product_name: string;
  supplies: ProductSupplyCheck[];
  all_supplies_available: boolean;
}

// ─── CRUD de Insumos ───────────────────────────────────────────

export async function listSupplies(category?: string, page: number = 1, pageSize: number = 100): Promise<SuppliesListResponse> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  params.append('page', String(page));
  params.append('page_size', String(pageSize));
  const res = await api.get(`/api/v1/supplies?${params}`);
  return res.data;
}

export async function createSupply(payload: SupplyCreatePayload): Promise<Supply> {
  const res = await api.post('/api/v1/supplies', payload);
  return res.data;
}

export async function updateSupply(id: string, payload: SupplyUpdatePayload): Promise<Supply> {
  const res = await api.put(`/api/v1/supplies/${id}`, payload);
  return res.data;
}

export async function deleteSupply(id: string): Promise<void> {
  await api.delete(`/api/v1/supplies/${id}`);
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/api/v1/supplies/categories/${id}`);
}

// ─── Vinculación producto ↔ insumo ───────────────────────────

export async function linkSupplyToProduct(
  productId: string,
  supplyId: string,
  quantityRequired: number
): Promise<{ detail: string }> {
  const res = await api.post(`/api/v1/products/${productId}/supplies`, {
    supply_id: supplyId,
    quantity_required: quantityRequired,
  });
  return res.data;
}

export async function unlinkSupplyFromProduct(productId: string, supplyId: string): Promise<void> {
  await api.delete(`/api/v1/products/${productId}/supplies/${supplyId}`);
}

export async function checkProductSupplies(productId: string): Promise<ProductSuppliesCheckResponse> {
  const res = await api.get(`/api/v1/products/${productId}/supplies/check`);
  return res.data;
}
