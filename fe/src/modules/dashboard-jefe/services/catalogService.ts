/**
 * Service: catalogService.ts
 * Endpoints para gestión del catálogo (admin/jefe)
 */

import axios from '@/api/axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Convierte una ruta relativa del backend (/uploads/...) a URL absoluta con CORS */
export const resolveImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) {
    // Usa el nuevo endpoint API que tiene CORS configurado
    const filename = url.replace('/uploads/', '');
    return `${API_BASE}/api/v1/uploads/${filename}`;
  }
  return url;
};

// ─────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Style {
  id: string;
  name: string;
  description?: string;
  brand_id: string;
  brand_name: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  state: boolean;
  is_active?: boolean;
  brand_id: string;
  brand_name: string;
  style_id: string;
  style_name: string;
  category_id: string;
  category_name: string;
  color?: string;
  insufficient_threshold?: number;
  image_url?: string;
  stock_total?: number;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

// ─────────────────────────────────────────
// MARCAS (Brands)
// ─────────────────────────────────────────

export const listBrands = async (): Promise<Brand[]> => {
  const res = await axios.get('/api/v1/admin/catalog/brands');
  return res.data.brands;
};

export const createBrand = async (name: string, description?: string): Promise<Brand> => {
  const res = await axios.post('/api/v1/admin/catalog/brands', { name, description });
  return res.data;
};

export const updateBrand = async (id: string, name: string, description?: string): Promise<Brand> => {
  const res = await axios.put(`/api/v1/admin/catalog/brands/${id}`, { name, description });
  return res.data;
};

export const deleteBrand = async (id: string): Promise<void> => {
  await axios.delete(`/api/v1/admin/catalog/brands/${id}`);
};

// ─────────────────────────────────────────
// ESTILOS (Styles)
// ─────────────────────────────────────────

export const listStyles = async (brandId?: string): Promise<Style[]> => {
  const url = brandId
    ? `/api/v1/admin/catalog/styles?brand_id=${brandId}`
    : '/api/v1/admin/catalog/styles';
  const res = await axios.get(url);
  return res.data.styles;
};

export const createStyle = async (name: string, brand_id: string, description?: string): Promise<Style> => {
  const res = await axios.post('/api/v1/admin/catalog/styles', { name, brand_id, description });
  return res.data;
};

export const updateStyle = async (id: string, name: string, brand_id: string, description?: string): Promise<Style> => {
  const res = await axios.put(`/api/v1/admin/catalog/styles/${id}`, { name, brand_id, description });
  return res.data;
};

export const deleteStyle = async (id: string): Promise<void> => {
  await axios.delete(`/api/v1/admin/catalog/styles/${id}`);
};

// ─────────────────────────────────────────
// PRODUCTOS
// ─────────────────────────────────────────

export interface ListProductsParams {
  brand_id?: string;
  style_id?: string;
  category_id?: string;
  state?: boolean;
}

export const listProducts = async (params?: ListProductsParams): Promise<Product[]> => {
  const res = await axios.get('/api/v1/admin/catalog/products', { params });
  return res.data.products;
};

export const createProduct = async (
  brand_id: string,
  style_id: string,
  category_id: string,
  name?: string,
  description?: string,
  color?: string,
  insufficient_threshold?: number
): Promise<Product> => {
  const res = await axios.post('/api/v1/admin/catalog/products', {
    name,
    description,
    color,
    insufficient_threshold,
    brand_id,
    style_id,
    category_id,
  });
  return res.data;
};

export const updateProduct = async (
  id: string,
  data: any
): Promise<Product> => {
  const res = await axios.put(`/api/v1/admin/catalog/products/${id}`, data);
  return res.data;
};

export const uploadProductImage = async (id: string, imageFile: File): Promise<{ image_url: string }> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const res = await axios.post(`/api/v1/admin/catalog/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const toggleProductState = async (id: string): Promise<Product> => {
  const res = await axios.put(`/api/v1/admin/catalog/products/${id}/toggle-state`, {});
  return res.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await axios.delete(`/api/v1/admin/catalog/products/${id}`);
};

// ─────────────────────────────────────────
// INVENTARIO
// ─────────────────────────────────────────

export const listInventory = async (productId?: string): Promise<InventoryItem[]> => {
  const url = productId
    ? `/api/v1/admin/catalog/inventory?product_id=${productId}`
    : '/api/v1/admin/catalog/inventory';
  const res = await axios.get(url);
  return res.data.inventory;
};

export const createOrUpdateInventory = async (
  product_id: string,
  size: string,
  quantity: number
): Promise<InventoryItem> => {
  const res = await axios.post('/api/v1/admin/catalog/inventory', {
    product_id,
    size,
    quantity,
  });
  return res.data;
};

export const deleteInventory = async (id: string): Promise<void> => {
  await axios.delete(`/api/v1/admin/catalog/inventory/${id}`);
};

export const bulkUpdateInventory = async (
  product_id: string,
  quantities: Record<number, number>
): Promise<any> => {
  const res = await axios.post('/api/v1/admin/catalog/inventory/bulk', {
    product_id,
    quantities,
  });
  return res.data;
};

// ─────────────────────────────────────────
// CATEGORÍAS (solo lectura - desde catálogo público)
// ─────────────────────────────────────────

export const listCategories = async (): Promise<Category[]> => {
  const res = await axios.get('/api/v1/catalog/categories');
  return res.data.categories;
};
