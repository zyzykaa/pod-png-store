-- ============================================================
-- POD PNG Store — Supabase Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PRODUCTS
-- ============================================================
create table products (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,           -- URL-friendly: "howdy-western-png"
  title       text not null,                  -- "Howdy PNG | Western Sublimation"
  description text,
  price       numeric(10,2) not null,         -- USD, e.g. 3.99
  compare_price numeric(10,2),               -- giá gốc để show "Reg. $X"
  category    text not null,                  -- "western", "christmas", "sports"...
  tags        text[] default '{}',            -- ["dtf","sublimation","tumbler"]
  file_path   text not null,                  -- Supabase Storage: designs/xxxx.zip
  preview_url text not null,                  -- watermarked preview image URL
  mockup_urls text[] default '{}',            -- mockup images on tshirt/mug/tumbler
  file_info   jsonb default '{}',             -- {"dpi":300,"format":"PNG","size":"4500x5400"}
  is_active   boolean default true,
  is_featured boolean default false,
  download_count integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index để tìm kiếm nhanh
create index idx_products_category on products(category);
create index idx_products_is_active on products(is_active);
create index idx_products_tags on products using gin(tags);
create index idx_products_slug on products(slug);

-- ============================================================
-- ORDERS
-- ============================================================
create table orders (
  id              uuid primary key default uuid_generate_v4(),
  -- Download token: dùng để tạo URL /download/[token]
  download_token  text unique not null default encode(gen_random_bytes(32), 'hex'),
  -- Thông tin người mua
  buyer_email     text not null,
  buyer_name      text,
  -- PayPal
  paypal_order_id text unique,               -- PayPal order ID từ createOrder
  paypal_capture_id text,                    -- PayPal capture ID sau khi capture
  -- Trạng thái
  status          text not null default 'pending'
                  check (status in ('pending','paid','failed','refunded')),
  amount          numeric(10,2) not null,
  currency        text default 'USD',
  -- Download tracking
  download_count  integer default 0,
  last_downloaded_at timestamptz,
  -- Timestamps
  created_at      timestamptz default now(),
  paid_at         timestamptz,
  updated_at      timestamptz default now()
);

create index idx_orders_status on orders(status);
create index idx_orders_download_token on orders(download_token);
create index idx_orders_paypal_order_id on orders(paypal_order_id);
create index idx_orders_buyer_email on orders(buyer_email);

-- ============================================================
-- ORDER ITEMS (1 order có thể mua nhiều design)
-- ============================================================
create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  price       numeric(10,2) not null,         -- giá tại thời điểm mua
  created_at  timestamptz default now()
);

create index idx_order_items_order_id on order_items(order_id);
create index idx_order_items_product_id on order_items(product_id);

-- ============================================================
-- DOWNLOAD LOGS (tracking mỗi lần tải)
-- ============================================================
create table download_logs (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  ip_address  text,
  user_agent  text,
  created_at  timestamptz default now()
);

create index idx_download_logs_order_id on download_logs(order_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table download_logs enable row level security;

-- Products: ai cũng đọc được (public catalog)
create policy "Products are publicly readable"
  on products for select using (is_active = true);

-- Admin có thể làm mọi thứ (dùng service role key)
create policy "Service role has full access to products"
  on products for all using (auth.role() = 'service_role');

create policy "Service role has full access to orders"
  on orders for all using (auth.role() = 'service_role');

create policy "Service role has full access to order_items"
  on order_items for all using (auth.role() = 'service_role');

create policy "Service role has full access to download_logs"
  on download_logs for all using (auth.role() = 'service_role');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Bucket 1: designs (PRIVATE - chỉ server mới access được)
-- Tạo trong Supabase dashboard: Storage > New bucket > "designs" > Private

-- Bucket 2: previews (PUBLIC - watermarked images để hiển thị)
-- Tạo trong Supabase dashboard: Storage > New bucket > "previews" > Public

-- ============================================================
-- SEED DATA MẪU (để test)
-- ============================================================
insert into products (slug, title, description, price, compare_price, category, tags, file_path, preview_url, mockup_urls, file_info, is_featured) values
(
  'howdy-western-sublimation',
  'Howdy PNG | Western Sublimation Design | DTF Ready',
  'High-quality western cowgirl design. Perfect for sublimation on t-shirts, tumblers, and mugs. 300 DPI transparent PNG background.',
  3.99,
  9.99,
  'western',
  ARRAY['dtf','sublimation','western','cowgirl','tumbler'],
  'designs/howdy-western-sublimation.zip',
  'https://placehold.co/800x800/f5f5f5/333?text=Howdy+Preview',
  ARRAY['https://placehold.co/600x600/f5f5f5/333?text=Mockup+Shirt','https://placehold.co/600x600/f5f5f5/333?text=Mockup+Mug'],
  '{"dpi": 300, "format": "PNG", "size": "4500x5400px", "includes": ["PNG transparent", "PNG white bg"]}',
  true
),
(
  'mama-floral-png',
  'Mama Floral PNG | Mother''s Day Design | Sublimation',
  'Beautiful floral mama design for Mother''s Day. Works great on DTF transfers, sublimation shirts, and tumbler wraps.',
  2.99,
  7.99,
  'mama',
  ARRAY['mama','mothers-day','floral','sublimation','dtf'],
  'designs/mama-floral.zip',
  'https://placehold.co/800x800/f5f5f5/333?text=Mama+Preview',
  ARRAY['https://placehold.co/600x600/f5f5f5/333?text=Mockup+Shirt'],
  '{"dpi": 300, "format": "PNG", "size": "4500x5400px", "includes": ["PNG transparent"]}',
  true
),
(
  'christmas-gnome-png',
  'Christmas Gnome PNG | Holiday Sublimation | DTF Design',
  'Cute Christmas gnome design perfect for holiday season products. High resolution transparent PNG.',
  3.49,
  8.99,
  'christmas',
  ARRAY['christmas','gnome','holiday','sublimation','dtf'],
  'designs/christmas-gnome.zip',
  'https://placehold.co/800x800/f5f5f5/333?text=Gnome+Preview',
  ARRAY['https://placehold.co/600x600/f5f5f5/333?text=Mockup+Shirt'],
  '{"dpi": 300, "format": "PNG", "size": "4500x5400px", "includes": ["PNG transparent"]}',
  false
);
