/**
 * Archivo: fe/src/types/products.ts
 * Descripción: Tipos centralizados para productos, catálogo e inventario.
 */

export interface Product {
  id: string;
  name_product: string;
  description_product?: string | null;
  style_id: string;
  style_name?: string | null;
  brand_id: string;
  brand_name?: string | null;
  category_id: string;
  category_name?: string | null;
  image_url?: string | null;
  colour?: string | null;
  state: 'activo' | 'inactivo';
  insufficient_threshold: number;
  created_at: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  size: string;
  colour?: string | null;
  amount: number;
  reserved: number;
  minimum_stock: number;
  created_at: string;
  updated_at?: string;
}

export interface Supply {
  id: string;
  name_supplies: string;
  description_supplies?: string | null;
  category: string;
  color?: string | null;
  stock_quantity: number;
  unit?: string;
  sizes?: Record<string, number> | null;
  created_at: string;
  updated_at?: string;
}

export interface ProductSupplyLink {
  id: string;
  product_id: string;
  supply_id: string;
  quantity_required: number;
  created_at: string;
}
