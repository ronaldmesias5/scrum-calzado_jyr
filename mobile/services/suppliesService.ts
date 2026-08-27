import { apiClient } from '@/services/apiClient';
import type {
  Supply,
  SupplyCategory,
  SupplyListResponse,
  SupplyCreateRequest,
  SupplyUpdateRequest,
  SupplyCategoryCreateRequest,
  SupplyCheckResponse,
} from '@/types/supplies';

export async function listSupplyCategories(): Promise<SupplyCategory[]> {
  const { data } = await apiClient.get<SupplyCategory[]>('/supplies/categories');
  return data ?? [];
}

export async function createSupplyCategory(
  body: SupplyCategoryCreateRequest,
): Promise<SupplyCategory> {
  const { data } = await apiClient.post<SupplyCategory>('/supplies/categories', body);
  return data;
}

export async function deleteSupplyCategory(categoryId: string): Promise<void> {
  await apiClient.delete(`/supplies/categories/${categoryId}`);
}

export async function listSupplies(
  page = 1,
  pageSize = 10,
  category?: string,
): Promise<SupplyListResponse> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (category) params.category = category;
  const { data } = await apiClient.get<SupplyListResponse>('/supplies', { params });
  return data;
}

export async function createSupply(body: SupplyCreateRequest): Promise<Supply> {
  const { data } = await apiClient.post<Supply>('/supplies', body);
  return data;
}

export async function updateSupply(
  supplyId: string,
  body: SupplyUpdateRequest,
): Promise<Supply> {
  const { data } = await apiClient.put<Supply>(`/supplies/${supplyId}`, body);
  return data;
}

export async function deleteSupply(supplyId: string): Promise<void> {
  await apiClient.delete(`/supplies/${supplyId}`);
}

export async function linkSupplyToProduct(
  productId: string,
  supplyId: string,
  quantityRequired: number,
): Promise<{ detail: string; quantity_required: number }> {
  const { data } = await apiClient.post<{ detail: string; quantity_required: number }>(
    `/products/${productId}/supplies`,
    { supply_id: supplyId, quantity_required: quantityRequired },
  );
  return data;
}

export async function unlinkSupplyFromProduct(
  productId: string,
  supplyId: string,
): Promise<void> {
  await apiClient.delete(`/products/${productId}/supplies/${supplyId}`);
}

export async function checkProductSupplies(
  productId: string,
): Promise<SupplyCheckResponse> {
  const { data } = await apiClient.get<SupplyCheckResponse>(
    `/products/${productId}/supplies/check`,
  );
  return data;
}
