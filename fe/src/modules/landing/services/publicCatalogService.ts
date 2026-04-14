import api from '@/api/axios';

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

export interface Product {
  id: string;
  name: string;
  description?: string;
  color?: string;
  brand_id?: string;
  style_id?: string;
  category_id?: string;
  image_url?: string;
  state?: boolean;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Style {
  id: string;
  name: string;
  brand_id?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface PublicCatalogFilters {
  category_id?: string;
  brand_id?: string;
  style_id?: string;
  color?: string;
  search?: string;
}

/**
 * Obtener todos los productos del catálogo público
 */
export const getPublicProducts = async (filters?: PublicCatalogFilters): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (filters?.category_id) params.append('category_id', filters.category_id);
  if (filters?.brand_id) params.append('brand_id', filters.brand_id);
  if (filters?.style_id) params.append('style_id', filters.style_id);
  if (filters?.color) params.append('color', filters.color);
  if (filters?.search) params.append('search', filters.search);

  const res = await api.get('/api/v1/catalog/products', { params });
  return res.data.products || [];
};

/**
 * Obtener categorías
 */
export const getCatalogCategories = async (): Promise<Category[]> => {
  const res = await api.get('/api/v1/catalog/categories');
  return res.data.categories || [];
};

/**
 * Obtener marcas
 */
export const getCatalogBrands = async (): Promise<Brand[]> => {
  const res = await api.get('/api/v1/catalog/brands');
  return res.data.brands || [];
};

/**
 * Obtener estilos
 */
export const getCatalogStyles = async (): Promise<Style[]> => {
  const res = await api.get('/api/v1/catalog/styles');
  return res.data.styles || [];
};

/**
 * Obtener colores disponibles
 */
export const getCatalogColors = async (): Promise<string[]> => {
  const res = await api.get('/api/v1/catalog/colors');
  return res.data.colors || [];
};
