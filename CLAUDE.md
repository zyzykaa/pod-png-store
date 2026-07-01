@AGENTS.md

# pod-png-store — Hướng dẫn cho AI Assistants

## Tổng quan dự án

**pod-png-store** là một marketplace bán thiết kế PNG dạng print-on-demand (POD). Người dùng duyệt sản phẩm, thanh toán qua PayPal, và nhận link tải file thiết kế gốc (không có watermark) qua token duy nhất. Được deploy trên **Vercel**, dùng **Supabase** làm database và storage.

Không có hệ thống đăng nhập cho người dùng cuối. Admin quản lý sản phẩm qua một secret key trong HTTP header.

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 16.2.9 (App Router, RSC) |
| Runtime | Node.js ≥ 20 |
| Language | TypeScript 5 |
| UI | React 19, inline `style={}` + CSS variables, Tailwind CSS 4 |
| State (client) | Zustand 5.0.14 (cart) |
| Database | Supabase PostgreSQL (direct SDK, không ORM) |
| Storage | Supabase Storage + Vercel Blob |
| Payment | PayPal Orders API v2 (`@paypal/react-paypal-js`) |
| Image Processing | Sharp (server-side), Jimp (fallback), Canvas API (client watermark) |
| Email | Resend (tuỳ chọn) |
| Analytics | Vercel Analytics |
| Deployment | Vercel |

> **Quan trọng:** Đây là **Next.js 16** — có breaking changes so với Next.js 13/14/15. Đọc guide trong `node_modules/next/dist/docs/` trước khi viết code liên quan đến routing, data fetching, hoặc middleware.

---

## Cấu trúc thư mục

```
pod-png-store/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Trang chủ (hero, reviews, featured products)
│   │   ├── shop/page.tsx           # Danh sách sản phẩm (filter, search, sort)
│   │   ├── products/[slug]/        # Chi tiết sản phẩm
│   │   ├── checkout/page.tsx       # Giỏ hàng + PayPal payment
│   │   ├── download/[token]/       # Trang tải file sau mua (token-gated)
│   │   ├── admin/page.tsx          # Quản lý sản phẩm (thêm/sửa/upload)
│   │   ├── contact/                # Trang liên hệ
│   │   ├── faq/                    # FAQ
│   │   ├── license/                # Trang giấy phép
│   │   ├── refund/                 # Chính sách hoàn tiền
│   │   ├── api/
│   │   │   ├── products/           # GET danh sách & chi tiết sản phẩm
│   │   │   ├── orders/             # POST tạo đơn hàng, POST capture PayPal
│   │   │   ├── download/           # GET signed URL tải file
│   │   │   ├── webhook/            # POST PayPal webhook
│   │   │   └── admin/              # CRUD sản phẩm, upload file (protected)
│   │   └── globals.css             # Global styles + Tailwind
│   ├── components/
│   │   ├── layout/Navbar.tsx       # Header cố định (logo, danh mục, mobile menu)
│   │   └── shop/
│   │       ├── ProductCard.tsx     # Card sản phẩm (ảnh, giá, tags, badge)
│   │       ├── ProductImage.tsx    # Hiển thị ảnh sản phẩm
│   │       ├── ProductCheckout.tsx # Checkout 1 sản phẩm (PayPal)
│   │       ├── CartBar.tsx         # Sidebar giỏ hàng
│   │       ├── RelatedProducts.tsx # Sản phẩm liên quan
│   │       └── PostPurchaseUpsell.tsx # Upsell sau mua
│   ├── hooks/
│   │   └── useCart.ts              # Zustand store cho giỏ hàng
│   ├── lib/
│   │   ├── supabase.ts             # Supabase clients (anon + service role), signed URLs
│   │   ├── paypal.ts               # PayPal API helpers
│   │   └── image.ts                # URL helpers cho ảnh
│   └── types/
│       └── index.ts                # Tất cả TypeScript interfaces + CATEGORIES constant
├── supabase/
│   └── migrations/001_initial_schema.sql
├── public/                         # Static assets
├── .env.example                    # Template biến môi trường
├── next.config.ts
├── tsconfig.json                   # Path alias: @/* → src/*
├── eslint.config.mjs               # ESLint 9 flat config
└── vercel.json                     # maxDuration 60s cho admin API routes
```

---

## Lệnh phát triển

```bash
npm run dev     # Khởi động dev server (http://localhost:3000)
npm run build   # Build production
npm run start   # Chạy production server
npm run lint    # ESLint check
```

Không có test runner — dự án chưa có test framework.

---

## Biến môi trường

Xem `.env.example` để biết danh sách đầy đủ. Copy thành `.env.local` để phát triển.

**Bắt buộc:**
```
NEXT_PUBLIC_SUPABASE_URL         # URL dự án Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Anon key (public, dùng ở client)
SUPABASE_SERVICE_ROLE_KEY        # Service role key (server-only, KHÔNG expose)
NEXT_PUBLIC_PAYPAL_CLIENT_ID     # PayPal app client ID
PAYPAL_CLIENT_SECRET             # PayPal app secret (server-only)
PAYPAL_MODE                      # "sandbox" hoặc "live"
PAYPAL_WEBHOOK_ID                # ID của PayPal webhook listener
NEXT_PUBLIC_BASE_URL             # URL gốc (vd: http://localhost:3000)
```

**Tuỳ chọn:**
```
RESEND_API_KEY      # Gửi email xác nhận đơn hàng
EMAIL_FROM          # Địa chỉ email người gửi
ADMIN_SECRET_KEY    # Key cho admin API (header: x-admin-key)
```

---

## Quy ước code

### Đặt tên
- **Routes/thư mục:** kebab-case (`/products/[slug]`, `/bulk-upload`)
- **Components:** PascalCase (`ProductCard.tsx`, `CartBar.tsx`)
- **Hooks:** camelCase với prefix `use` (`useCart.ts`)
- **Utilities/lib:** camelCase (`supabase.ts`, `paypal.ts`)
- **Interfaces:** PascalCase (`Product`, `Order`, `CartItem`)

### Styling
- **Ưu tiên:** inline `style={}` + CSS custom properties (variables)
- **Utility classes:** Tailwind CSS 4 cho layout và spacing
- **Không dùng:** CSS Modules, styled-components, hay emotion
- Global styles nằm trong `src/app/globals.css`

### State management
- **Giỏ hàng:** Zustand store trong `src/hooks/useCart.ts`, persist vào localStorage với key `pod-cart`
- **Form state:** React `useState` (admin page, checkout)
- **Không dùng:** Redux, Context API, TanStack Query, SWR

### Path alias
```typescript
import { Product } from '@/types'        // → src/types/index.ts
import { supabase } from '@/lib/supabase' // → src/lib/supabase.ts
```

---

## Database (Supabase)

**Không có ORM** — dùng trực tiếp Supabase JS SDK.

### Các bảng

| Bảng | Mô tả |
|---|---|
| `products` | Sản phẩm (slug unique, tags[], mockup_urls[], file_info JSONB) |
| `orders` | Đơn hàng (download_token unique, PayPal IDs, status) |
| `order_items` | Quan hệ order ↔ product (nhiều-nhiều) |
| `download_logs` | Log tải file (IP, user agent, timestamp) |

### Storage buckets
- `designs` — **Private.** File thiết kế gốc. Chỉ truy cập qua signed URL (hết hạn sau 1 giờ).
- `previews` — **Public.** Ảnh preview có watermark. URL trực tiếp.

### RLS (Row Level Security)
- `products`: Public đọc nếu `is_active = true`. Service role có toàn quyền.
- `orders`, `order_items`, `download_logs`: Chỉ service role (server-side).

### Clients
```typescript
// src/lib/supabase.ts
import { supabase }        from '@/lib/supabase' // anon client (browser/public)
import { supabaseAdmin }   from '@/lib/supabase' // service role (server-only)
```

Migration schema nằm ở `supabase/migrations/001_initial_schema.sql`.

---

## API Routes

| Route | Method | Mô tả |
|---|---|---|
| `/api/products` | GET | Danh sách sản phẩm (filter, search, sort, pagination) |
| `/api/products/[slug]` | GET | Chi tiết 1 sản phẩm |
| `/api/products/related` | GET | Sản phẩm liên quan |
| `/api/orders` | POST | Tạo đơn hàng + PayPal order |
| `/api/orders/capture` | POST | Capture PayPal payment |
| `/api/download` | GET | Lấy signed URL tải file (cần download token) |
| `/api/webhook` | POST | PayPal webhook (payment.capture.completed, refunded) |
| `/api/admin/products` | GET/POST/PUT/DELETE | CRUD sản phẩm (cần `x-admin-key`) |
| `/api/admin/upload` | POST | Upload file preview/design/variation (cần `x-admin-key`) |
| `/api/admin/bulk-upload` | POST | Bulk upload sản phẩm (cần `x-admin-key`) |
| `/api/admin/rebuild-preview` | POST | Tái tạo watermarked preview (cần `x-admin-key`) |

---

## Auth & Admin

**Không có hệ thống auth cho người dùng cuối.**

- **Admin:** Gửi header `x-admin-key: <ADMIN_SECRET_KEY>` với mọi request đến `/api/admin/**`. Server so sánh với `process.env.ADMIN_SECRET_KEY`.
- **Download:** Truy cập qua `download_token` (hex ngẫu nhiên 32 bytes) trong URL — không cần đăng nhập.
- **PayPal:** Webhook xác minh bằng chữ ký từ PayPal.

---

## Luồng thanh toán (PayPal)

1. Client tạo giỏ hàng với Zustand (`useCart`)
2. POST `/api/orders` → tạo record `orders` + gọi PayPal để lấy `paypal_order_id`
3. Client PayPal SDK hiện modal thanh toán
4. Sau khi user approve → POST `/api/orders/capture` → capture payment
5. Khi capture thành công → PayPal gửi webhook đến `/api/webhook`
6. Webhook cập nhật `orders.status = 'paid'`, ghi `paid_at`, gửi email (nếu có Resend)
7. User nhận link download với `download_token`

---

## Xử lý ảnh

- **Preview (watermark):** Tạo server-side bằng **Sharp** khi upload; fallback là **Jimp**. Lưu vào Supabase Storage bucket `previews` (public).
- **Thiết kế gốc:** Lưu vào Supabase Storage bucket `designs` (private). Chỉ truy cập qua signed URL 1 giờ.
- **Watermark client-side:** Canvas API được dùng trong admin để preview trước khi upload.
- **Next.js Image:** Cho phép remote patterns từ `*.supabase.co` và `*.vercel-storage.com` (cấu hình trong `next.config.ts`).
- **Vercel Blob:** Dùng cho một số loại file upload (`@vercel/blob`).

---

## Deployment & CI/CD

- **Platform:** Vercel — auto-deploy khi push lên `main`
- **Không có GitHub Actions** — không có CI tự động
- **Admin routes timeout:** 60 giây (`vercel.json`) — cần thiết cho xử lý ảnh nặng
- **Node.js requirement:** ≥ 20

---

## Lưu ý quan trọng

1. **Next.js 16 có breaking changes** — luôn đọc `node_modules/next/dist/docs/` trước khi làm việc với routing, middleware, hay data fetching.
2. **Không có test** — chưa có jest/vitest/playwright. Kiểm tra thủ công.
3. **`SUPABASE_SERVICE_ROLE_KEY` là bí mật** — chỉ dùng server-side, không bao giờ expose ra client bundle.
4. **Inline styles là chủ đạo** — đừng refactor sang CSS modules hay styled-components trừ khi được yêu cầu.
5. **Kiểu dữ liệu:** Tất cả interfaces tập trung ở `src/types/index.ts` và hằng số `CATEGORIES`.
6. **Vietnamese trong code:** Một số comment và log message bằng tiếng Việt — đây là chủ ý.
