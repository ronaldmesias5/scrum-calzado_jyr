export interface SupplyCategory {
  id: string;
  name: string;
  color: string;
  global_stage: string | null;
}

export interface SupplyProductLink {
  product_id: string;
  product_name: string;
  quantity_required: number;
}

export interface Supply {
  id: string;
  name: string;
  description: string | null;
  category: string;
  color: string | null;
  stock_quantity: number;
  sizes: Record<string, number> | null;
  unit: string | null;
  created_at: string;
  linked_products: SupplyProductLink[];
}

export interface SupplyListResponse {
  items: Supply[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SupplyCreateRequest {
  name: string;
  description?: string;
  category: string;
  color?: string;
  stock_quantity?: number;
  sizes?: Record<string, number> | null;
  unit?: string;
}

export interface SupplyUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  color?: string;
  stock_quantity?: number;
  sizes?: Record<string, number> | null;
  unit?: string;
}

export interface SupplyCategoryCreateRequest {
  name: string;
  global_stage?: string;
}

export interface LinkSupplyRequest {
  supply_id: string;
  quantity_required: number;
}

export interface SupplyCheckResponse {
  product_id: string;
  product_name: string;
  supplies: Array<{
    supply_id: string;
    supply_name: string;
    supply_color: string | null;
    supply_unit: string | null;
    supply_category: string;
    global_stage: string | null;
    quantity_required: number;
    stock_quantity: number;
    stock_sufficient: boolean;
  }>;
  all_supplies_available: boolean;
}
