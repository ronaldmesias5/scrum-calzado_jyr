export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
}

export interface Style {
  id: string;
  name: string;
  description?: string | null;
  brand_id: string;
  brand_name: string;
  created_at?: string;
}

export interface SizeInventory {
  size: string;
  available: number;
}

export interface TaskPrices {
  corte: number;
  guarnicion: number;
  soladura: number;
  emplantillado: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  color: string | null;
  image_url: string | null;
  insufficient_threshold: number;
  state: boolean;
  brand_id: string;
  brand_name: string;
  style_id: string;
  style_name: string;
  category_id: string;
  category_name: string;
  stock_total?: number;
  manufactured_pairs?: number;
  task_prices?: TaskPrices | null;
  created_at?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductDetailResponse extends Product {
  sizes_inventory: SizeInventory[];
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  size: string;
  quantity: number;
  created_at?: string;
}

export interface InventoryListResponse {
  inventory: InventoryItem[];
}

export interface BulkInventoryResult {
  size: string;
  quantity: number;
  action: string;
}

export interface BulkInventoryResponse {
  product_id: string;
  product_name: string;
  stock_total: number;
  updated_count: number;
  created_count: number;
  results: BulkInventoryResult[];
  message: string;
}

export interface ListCatalogParams {
  brand_id?: string;
  style_id?: string;
  category_id?: string;
  state?: boolean;
  page?: number;
  page_size?: number;
}
