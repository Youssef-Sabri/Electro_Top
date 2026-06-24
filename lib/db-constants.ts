export const PRODUCT_SELECT_FIELDS = 'id, name, description, price, image_url, stock, is_active, category, created_at'

export const ORDER_SELECT_FIELDS = 'id_unique_tracking, status, customer_name, phone_number, shipping_address, total_amount, created_at, admin_notes, location_link, instapay_screenshot, instapay_phone_number'

export const ORDER_ITEM_SELECT_FIELDS = 'id, order_id, product_id, quantity, unit_price'

export const STATUS_HISTORY_SELECT_FIELDS = 'id, order_id, status, timestamp'
