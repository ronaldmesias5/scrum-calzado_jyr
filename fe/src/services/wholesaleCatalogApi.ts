import api from "@/services/axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Convierte una ruta relativa del backend (/uploads/...) a URL absoluta con CORS */
export const resolveImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("/uploads/")) {
    const filename = url.replace("/uploads/", "");
    return `${API_BASE}/api/v1/uploads/${filename}`;
  }
  return url;
};

export interface WholesaleProduct {
  id: string;
  name: string;
  style_id: string;
  style_name: string;
  category_id: string;
  category_name: string;
  brand_id: string;
  brand_name: string;
  image_url?: string | null;
  color?: string | null;
  available: number;
}

export interface Brand {
  id: string;
  name: string;
  description?: string | null;
}

export interface Style {
  id: string;
  name: string;
  brand_id?: string;
  brand_name?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface WholesaleCatalogFilters {
  category_id?: string;
  brand_id?: string;
  style_id?: string;
  color?: string;
  search?: string;
}

export interface WholesaleCatalogListResponse {
  products: WholesaleProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Obtener productos del catálogo mayorista con paginación y filtros */
export const getWholesaleProducts = async (
  filters?: WholesaleCatalogFilters,
  page = 1,
  pageSize = 12,
): Promise<WholesaleCatalogListResponse> => {
  const params = new URLSearchParams();
  if (filters?.category_id) params.append("category_id", filters.category_id);
  if (filters?.brand_id) params.append("brand_id", filters.brand_id);
  if (filters?.style_id) params.append("style_id", filters.style_id);
  if (filters?.color) params.append("color", filters.color);
  if (filters?.search) params.append("search", filters.search);
  params.append("page", String(page));
  params.append("page_size", String(pageSize));

  const res = await api.get("/api/v1/catalog/products", { params });
  return res.data;
};

/** Obtener categorías */
export const getWholesaleCategories = async (): Promise<Category[]> => {
  const res = await api.get("/api/v1/catalog/categories");
  return res.data.categories || [];
};

/** Obtener marcas */
export const getWholesaleBrands = async (): Promise<Brand[]> => {
  const res = await api.get("/api/v1/catalog/brands");
  return res.data.brands || [];
};

/** Obtener estilos */
export const getWholesaleStyles = async (): Promise<Style[]> => {
  const res = await api.get("/api/v1/catalog/styles");
  return res.data.styles || [];
};

/** Obtener colores disponibles */
export const getWholesaleColors = async (): Promise<string[]> => {
  const res = await api.get("/api/v1/catalog/colors");
  return res.data.colors || [];
};
