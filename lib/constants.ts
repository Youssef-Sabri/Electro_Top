export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const TRACKING_ID_REGEX = /^ET-[A-Z0-9]{10}$/i;

export const SITE_METADATA = {
  title: 'إلكترو توب | مستلزمات كهربائية معتمدة',
  description: 'متجر إلكتروني متخصص في المستلزمات الكهربائية. تسوق كزائر وتتبع طلبك بسهولة.',
  url: process.env.NEXT_PUBLIC_SITE_URL || '',
} as const;

export const PRODUCT_SELECT_FIELDS = 'id, name, description, price, image_url, image_url_2, image_url_3, stock, is_active, category, created_at, has_colors, colors';

export const ORDER_SELECT_FIELDS = 'id_unique_tracking, status, customer_name, phone_number, shipping_address, total_amount, created_at, admin_notes, location_link, instapay_screenshot, instapay_phone_number, payment_method';

export const ORDER_ITEM_SELECT_FIELDS = 'id, order_id, product_id, quantity, unit_price, selected_color';

export const STATUS_HISTORY_SELECT_FIELDS = 'id, order_id, status, created_at';

export const VALID_ORDER_STATUSES = [
  'Pending Review', 'Accepted', 'Processing', 'Delivered', 'Declined', 'Check Internal Note',
] as const;

export const ADMIN_NOTES_MAX_LENGTH = 2000;

export const TABLES = {
  orders: 'orders',
  products: 'products',
  orderItems: 'order_items',
  orderStatusHistory: 'order_status_history',
  categories: 'categories',
  loginAttempts: 'login_attempts',
  trackingLookups: 'tracking_lookups',
  orderRateLimits: 'order_rate_limits',
  receiptUploadLimits: 'receipt_upload_limits',
  cspReportLimits: 'csp_report_limits',
} as const;

export const STORAGE_BUCKETS = {
  receipts: 'instapay-receipts',
  productImages: 'product-images',
} as const;

export const RATE_LIMIT_CONFIGS = {
  login: {
    table: TABLES.loginAttempts,
    countColumn: 'attempt_count',
    lastColumn: 'last_attempt_at',
    firstColumn: 'first_attempt_at',
    maxAttempts: 5,
    windowMs: 60_000,
  },
  order: {
    table: TABLES.orderRateLimits,
    countColumn: 'request_count',
    lastColumn: 'last_request_at',
    firstColumn: 'first_request_at',
    maxAttempts: 5,
    windowMs: 60_000,
  },
  receiptUpload: {
    table: TABLES.receiptUploadLimits,
    countColumn: 'request_count',
    lastColumn: 'last_request_at',
    firstColumn: 'first_attempt_at',
    maxAttempts: 3,
    windowMs: 60_000,
  },
  tracking: {
    table: TABLES.trackingLookups,
    countColumn: 'lookup_count',
    lastColumn: 'last_lookup_at',
    firstColumn: 'first_attempt_at',
    maxAttempts: 10,
    windowMs: 60_000,
  },
  cspReport: {
    table: TABLES.cspReportLimits,
    countColumn: 'request_count',
    lastColumn: 'last_request_at',
    firstColumn: 'first_attempt_at',
    maxAttempts: 10,
    windowMs: 60_000,
  },
} as const;

export const ADMIN_ROLE = 'admin' as const;

export function isAdminRole(role: unknown): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

