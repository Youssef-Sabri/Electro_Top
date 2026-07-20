import type { VALID_ORDER_STATUSES } from '@/lib/constants';

export type OrderStatus = (typeof VALID_ORDER_STATUSES)[number];

export interface Product {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_url_2?: string | null;
  image_url_3?: string | null;
  stock: number;
  is_active: boolean;
  category?: string | null;
  created_at: string;
  updated_at?: string | null;
  has_colors: boolean;
  colors: string[];
  sort_order?: number;
}


export type PaymentMethod = 'instapay' | 'cod';

export interface Order {
  id_unique_tracking: string;
  status: OrderStatus;
  customer_name: string;
  phone_number: string;
  shipping_address: string;
  total_amount: number;
  created_at: string;
  payment_method: PaymentMethod;
  admin_notes?: string | null;
  location_link?: string | null;
  instapay_screenshot?: string | null;
  instapay_phone_number?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
  product_image?: string;
  selected_color?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string | null;
}

export interface CategoryGroup {
  name: string;
  icon: string;
  subcategories: string[];
}
