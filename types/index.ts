export type OrderStatus =
  | 'Pending Review'
  | 'Accepted'
  | 'Processing'
  | 'Delivered'
  | 'Declined'
  | 'Check Internal Note';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  is_active: boolean;
  category?: string | null;
  created_at: string;
}


export interface Order {
  id_unique_tracking: string;
  status: OrderStatus;
  customer_name: string;
  phone_number: string;
  shipping_address: string;
  total_amount: number;
  created_at: string;
  admin_notes?: string;
  location_link?: string;
  instapay_screenshot?: string;
  instapay_phone_number?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
  product_image?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  timestamp: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
