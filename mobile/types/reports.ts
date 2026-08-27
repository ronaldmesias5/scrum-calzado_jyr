export interface ReportKPIs {
  total_orders: number;
  total_pairs_sold: number;
  total_tasks_completed: number;
  pairs_in_production: number;
}

export interface SalesByCategory {
  category_name: string;
  pairs_sold: number;
  percentage: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  sales: number;
  image_url: string | null;
}

export interface TopCustomer {
  user_id: string;
  name: string;
  total_orders: number;
  total_pairs: number;
}

export interface TopEmployee {
  user_id: string;
  name: string;
  occupation: string;
  completed_tasks: number;
}

export interface DashboardReport {
  kpis: ReportKPIs;
  sales_by_category: SalesByCategory[];
  top_products: TopProduct[];
  top_customers: TopCustomer[];
  top_employees: TopEmployee[];
}

export interface TaskBreakdown {
  process_name: string;
  count: number;
}

export interface TaskListItem {
  id: string;
  order_id: string | null;
  product_name: string;
  process_name: string;
  amount: number;
  status: string;
  colour: string | null;
  vale_number: number;
  created_at: string;
  completed_at: string | null;
  price_per_dozen: number;
  task_total_price: number;
  product_category: string | null;
  product_image: string | null;
  product_details: Array<{
    product_id: string;
    product_name: string;
    pairs: number;
    price_per_dozen: number;
    total_price: number;
  }>;
}

export interface EmployeeReport {
  user_id: string;
  name: string;
  occupation: string;
  total_tasks_completed: number;
  total_pairs_produced: number;
  total_earnings: number;
  tasks_breakdown: TaskBreakdown[];
  tasks_list: TaskListItem[];
}

export interface CustomerOrderItem {
  product_id: string;
  product_name: string;
  image_url: string | null;
  amount: number;
  category_name: string | null;
  colour: string | null;
}

export interface CustomerOrder {
  id: string;
  total_pairs: number;
  total_price: number;
  state: string;
  created_at: string;
  items: CustomerOrderItem[];
}

export interface CustomerReport {
  user_id: string;
  name: string;
  total_orders: number;
  total_pairs: number;
  total_spent: number;
  orders: CustomerOrder[];
}

export interface WeeklyMetric {
  week: string;
  pairs_manufactured: number;
  tasks_completed: number;
  orders_created: number;
  pairs_ordered: number;
}

export interface OrderItemSummary {
  product_id: string;
  product_name: string;
  pairs: number;
}

export interface ProductionReport {
  total_pairs_period: number;
  total_tasks_period: number;
  total_orders_period: number;
  total_orders_created: number;
  total_pairs_ordered: number;
  weekly_metrics: WeeklyMetric[];
  orders: Array<{
    id: string;
    total_pairs: number;
    total_price: number;
    state: string;
    created_at: string;
    items: OrderItemSummary[];
  }>;
}

export interface SalesWeeklyMetric {
  week: string;
  orders_created: number;
  pairs_ordered: number;
}

export interface SalesReport {
  total_orders_period: number;
  total_pairs_period: number;
  weekly_metrics: SalesWeeklyMetric[];
}
