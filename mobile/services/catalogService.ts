import { apiClient } from '@/services/apiClient';
import type {
  Brand,
  BulkInventoryResponse,
  Category,
  InventoryItem,
  InventoryListResponse,
  ListCatalogParams,
  Product,
  ProductDetailResponse,
  ProductListResponse,
  Style,
} from '@/types/catalog';

export interface AdminBrandResponse {
  id: string;
  name: string;
  description?: string | null;
  message?: string;
}

export interface AdminStyleResponse {
  id: string;
  name: string;
  description?: string | null;
  brand_id: string;
  brand_name: string;
  message?: string;
}

export interface AdminProductResponse {
  id: string;
  name: string;
  state: boolean;
  message?: string;
}

export const catalogService = {
  // ─── Public catalog (no auth) ───────────────────────────

  async listCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<{ categories: Category[] }>('/catalog/categories');
    return data.categories;
  },

  async listBrandsPublic(): Promise<Brand[]> {
    const { data } = await apiClient.get<{ brands: Brand[] }>('/catalog/brands');
    return data.brands;
  },

  async listStylesPublic(): Promise<Style[]> {
    const { data } = await apiClient.get<{ styles: Style[] }>('/catalog/styles');
    return data.styles;
  },

  async listColors(): Promise<string[]> {
    const { data } = await apiClient.get<{ colors: string[] }>('/catalog/colors');
    return data.colors;
  },

  // ─── Admin products (JWT + jefe) ────────────────────────

  async listProducts(params?: ListCatalogParams): Promise<ProductListResponse> {
    const query: Record<string, string | number | boolean> = {};
    if (params?.brand_id) query.brand_id = params.brand_id;
    if (params?.style_id) query.style_id = params.style_id;
    if (params?.category_id) query.category_id = params.category_id;
    if (params?.state !== undefined) query.state = params.state;
    if (params?.page) query.page = params.page;
    if (params?.page_size) query.page_size = params.page_size;
    const { data } = await apiClient.get<ProductListResponse>('/admin/catalog/products', {
      params: query,
    });
    return data;
  },

  async getProduct(productId: string): Promise<ProductDetailResponse> {
    const { data } = await apiClient.get<ProductDetailResponse>(
      `/catalog/products/${productId}`,
    );
    return data;
  },

  async createProduct(body: {
    name?: string;
    description?: string;
    color?: string;
    brand_id: string;
    style_id: string;
    category_id: string;
    insufficient_threshold?: number;
  }): Promise<AdminProductResponse> {
    const { data } = await apiClient.post<AdminProductResponse>('/admin/catalog/products', body);
    return data;
  },

  async updateProduct(
    productId: string,
    body: {
      name?: string;
      description?: string;
      color?: string;
      brand_id: string;
      style_id: string;
      category_id: string;
      insufficient_threshold?: number;
    },
  ): Promise<AdminProductResponse> {
    const { data } = await apiClient.put<AdminProductResponse>(
      `/admin/catalog/products/${productId}`,
      body,
    );
    return data;
  },

  async deleteProduct(productId: string): Promise<void> {
    await apiClient.delete(`/admin/catalog/products/${productId}`);
  },

  async toggleProductState(productId: string): Promise<{ id: string; state: boolean }> {
    const { data } = await apiClient.put<{ id: string; state: boolean }>(
      `/admin/catalog/products/${productId}/toggle-state`,
      {},
    );
    return data;
  },

  // ─── Admin brands ───────────────────────────────────────

  async listAdminBrands(): Promise<Brand[]> {
    const { data } = await apiClient.get<{ brands: Brand[] }>('/admin/catalog/brands');
    return data.brands;
  },

  async createBrand(name: string, description?: string): Promise<AdminBrandResponse> {
    const { data } = await apiClient.post<AdminBrandResponse>('/admin/catalog/brands', {
      name,
      description,
    });
    return data;
  },

  async updateBrand(
    brandId: string,
    name: string,
    description?: string,
  ): Promise<AdminBrandResponse> {
    const { data } = await apiClient.put<AdminBrandResponse>(
      `/admin/catalog/brands/${brandId}`,
      { name, description },
    );
    return data;
  },

  async deleteBrand(brandId: string): Promise<void> {
    await apiClient.delete(`/admin/catalog/brands/${brandId}`);
  },

  // ─── Admin styles ───────────────────────────────────────

  async listAdminStyles(brandId?: string): Promise<Style[]> {
    const params: Record<string, string> = {};
    if (brandId) params.brand_id = brandId;
    const { data } = await apiClient.get<{ styles: Style[] }>('/admin/catalog/styles', {
      params,
    });
    return data.styles;
  },

  async createStyle(
    name: string,
    brandId: string,
    description?: string,
  ): Promise<AdminStyleResponse> {
    const { data } = await apiClient.post<AdminStyleResponse>('/admin/catalog/styles', {
      name,
      brand_id: brandId,
      description,
    });
    return data;
  },

  async updateStyle(
    styleId: string,
    name: string,
    brandId: string,
    description?: string,
  ): Promise<AdminStyleResponse> {
    const { data } = await apiClient.put<AdminStyleResponse>(
      `/admin/catalog/styles/${styleId}`,
      { name, brand_id: brandId, description },
    );
    return data;
  },

  async deleteStyle(styleId: string): Promise<void> {
    await apiClient.delete(`/admin/catalog/styles/${styleId}`);
  },

  // ─── Admin categories (public endpoints used as admin) ──

  async createCategory(name: string, description?: string): Promise<{ id: string; name: string; message: string }> {
    const { data } = await apiClient.post<{ id: string; name: string; message: string }>(
      '/admin/catalog/categories',
      { name, description },
    );
    return data;
  },

  async updateCategory(
    categoryId: string,
    name: string,
    description?: string,
  ): Promise<{ id: string; name: string; message: string }> {
    const { data } = await apiClient.put<{ id: string; name: string; message: string }>(
      `/admin/catalog/categories/${categoryId}`,
      { name, description },
    );
    return data;
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await apiClient.delete(`/admin/catalog/categories/${categoryId}`);
  },

  // ─── Inventory ──────────────────────────────────────────

  async listInventory(productId?: string): Promise<InventoryItem[]> {
    const params: Record<string, string> = {};
    if (productId) params.product_id = productId;
    const { data } = await apiClient.get<InventoryListResponse>('/admin/catalog/inventory', {
      params,
    });
    return data.inventory;
  },

  async createOrUpdateInventory(
    productId: string,
    size: string,
    quantity: number,
  ): Promise<InventoryItem & { message: string }> {
    const { data } = await apiClient.post<InventoryItem & { message: string }>(
      '/admin/catalog/inventory',
      { product_id: productId, size, quantity },
    );
    return data;
  },

  async deleteInventory(inventoryId: string): Promise<void> {
    await apiClient.delete(`/admin/catalog/inventory/${inventoryId}`);
  },

  async bulkUpdateInventory(
    productId: string,
    quantities: Record<string, number>,
  ): Promise<BulkInventoryResponse> {
    const { data } = await apiClient.post<BulkInventoryResponse>(
      '/admin/catalog/inventory/bulk',
      { product_id: productId, quantities },
    );
    return data;
  },

  // ─── Product image ──────────────────────────────────────

  async uploadProductImage(productId: string, fileUri: string): Promise<{ image_url: string }> {
    const form = new FormData();
    const ext = fileUri.split('.').pop() ?? 'jpg';
    form.append('image', {
      uri: fileUri,
      name: `product_${productId}.${ext}`,
      type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    } as unknown as Blob);
    const { data } = await apiClient.post<{ image_url: string }>(
      `/admin/catalog/products/${productId}/image`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },
};
