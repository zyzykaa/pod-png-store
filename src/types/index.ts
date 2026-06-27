// ============================================================
// Types cho POD PNG Store
// ============================================================

export interface Product {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  compare_price: number | null
  category: string
  tags: string[]
  file_path: string
  preview_url: string
  mockup_urls: string[]
  file_info: {
    dpi: number
    format: string
    size: string
    includes: string[]
  }
  is_active: boolean
  is_featured: boolean
  download_count: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  download_token: string
  buyer_email: string
  buyer_name: string | null
  paypal_order_id: string | null
  paypal_capture_id: string | null
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  amount: number
  currency: string
  download_count: number
  last_downloaded_at: string | null
  created_at: string
  paid_at: string | null
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  price: number
  created_at: string
  product?: Product
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { product: Product })[]
}

// Cart state (client-side only, không lưu DB)
export interface CartItem {
  product: Product
  quantity: 1  // Digital goods: luôn là 1
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface CreateOrderPayload {
  items: { product_id: string; price: number }[]
  buyer_email: string
  buyer_name?: string
}

export interface CaptureOrderPayload {
  paypal_order_id: string
}

// PayPal types
export interface PayPalOrderDetails {
  id: string
  status: string
  purchase_units: {
    amount: { value: string; currency_code: string }
    payments?: {
      captures?: { id: string; status: string }[]
    }
  }[]
  payer?: {
    email_address?: string
    name?: { given_name?: string; surname?: string }
  }
}

// Download page
export interface DownloadPageData {
  order: OrderWithItems
  signed_urls: {
    product_id: string
    product_title: string
    url: string
    expires_at: string
  }[]
}

// Product categories
export const CATEGORIES = [
  { value: 'all', label: 'All Designs' },
  { value: 'western', label: 'Western & Country' },
  { value: 'christmas', label: 'Christmas' },
  { value: 'mama', label: 'Mama Designs' },
  { value: 'sports', label: 'Sports & Teams' },
  { value: 'halloween', label: 'Halloween & Fall' },
  { value: 'christian', label: 'Christian & Faith' },
  { value: 'summer', label: 'Summer' },
  { value: 'valentines', label: "Valentine's Day" },
  { value: 'patriotic', label: '4th of July' },
  { value: 'coffee', label: 'Coffee Lovers' },
  { value: 'tumbler', label: 'Tumbler Wraps' },
  { value: 'misc', label: 'Miscellaneous' },
] as const

export type Category = typeof CATEGORIES[number]['value']
