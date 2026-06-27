import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import ProductCard from '@/components/shop/ProductCard'
import { Product, CATEGORIES } from '@/types'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>
}

async function getProducts(category?: string, search?: string, page = 1) {
  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * 24, page * 24 - 1)

  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, count } = await query
  return { products: data || [], total: count || 0 }
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams
  const category = params.category || 'all'
  const search = params.search || ''
  const page = parseInt(params.page || '1')

  const { products, total } = await getProducts(category, search, page)
  const totalPages = Math.ceil(total / 24)

  const currentCategory = CATEGORIES.find(c => c.value === category)

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          {search ? `Search: "${search}"` : currentCategory?.label || 'All Designs'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {total} designs found {search && `for "${search}"`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Sidebar filter */}
        <aside style={{
          width: 200, flexShrink: 0,
          position: 'sticky', top: 120,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
            Categories
          </div>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              href={cat.value === 'all' ? '/shop' : `/shop?category=${cat.value}`}
              style={{
                display: 'block', padding: '8px 12px', borderRadius: 8,
                fontSize: 14, textDecoration: 'none', marginBottom: 2,
                fontWeight: category === cat.value ? 600 : 400,
                color: category === cat.value ? 'var(--brand-accent)' : 'var(--text)',
                background: category === cat.value ? '#fef2f4' : 'transparent',
              }}
            >
              {cat.label}
            </Link>
          ))}
        </aside>

        {/* Products */}
        <div style={{ flex: 1 }}>
          {/* Search bar */}
          <form style={{ marginBottom: 24 }}>
            <input
              name="search"
              defaultValue={search}
              placeholder="Search designs..."
              style={{
                width: '100%', height: 44, padding: '0 16px',
                border: '1.5px solid var(--border)', borderRadius: 10,
                fontSize: 14, outline: 'none',
              }}
            />
          </form>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>No designs found</h3>
              <p style={{ marginBottom: 24 }}>Try a different search or browse all categories</p>
              <Link href="/shop" className="btn btn-primary">Browse All Designs</Link>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 48 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Link
                      key={p}
                      href={`/shop?${new URLSearchParams({ ...(category !== 'all' && { category }), ...(search && { search }), page: p.toString() })}`}
                      style={{
                        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 8, fontSize: 14, textDecoration: 'none',
                        background: page === p ? 'var(--brand)' : 'transparent',
                        color: page === p ? 'white' : 'var(--text)',
                        border: `1px solid ${page === p ? 'transparent' : 'var(--border)'}`,
                        fontWeight: page === p ? 600 : 400,
                      }}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
