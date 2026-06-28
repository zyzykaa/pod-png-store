'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/shop/ProductCard'
import { Product, CATEGORIES } from '@/types'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ShopPage() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (search) params.set('search', search)
    params.set('page', page.toString())

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(d => {
        setProducts(d.data || [])
        setTotal(d.pagination?.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, search, page])

  const totalPages = Math.ceil(total / 24)
  const currentCategory = CATEGORIES.find(c => c.value === category)

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          {search ? `Search: "${search}"` : currentCategory?.label || 'All Designs'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {loading ? 'Loading...' : `${total} designs found`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ width: 200, flexShrink: 0, position: 'sticky', top: 120 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>
            CATEGORIES
          </div>
          {CATEGORIES.map(cat => (
            <Link key={cat.value}
              href={cat.value === 'all' ? '/shop' : `/shop?category=${cat.value}`}
              style={{
                display: 'block', padding: '8px 12px', borderRadius: 8,
                fontSize: 14, textDecoration: 'none', marginBottom: 2,
                fontWeight: category === cat.value ? 600 : 400,
                color: category === cat.value ? 'var(--brand-accent)' : 'var(--text)',
                background: category === cat.value ? '#fef2f4' : 'transparent',
              }}>
              {cat.label}
            </Link>
          ))}
        </aside>

        {/* Products */}
        <div style={{ flex: 1 }}>
          <form onSubmit={e => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const s = fd.get('search') as string
            window.location.href = s ? `/shop?search=${encodeURIComponent(s)}` : '/shop'
          }} style={{ marginBottom: 24 }}>
            <input name="search" defaultValue={search}
              placeholder="Search designs..."
              style={{ width: '100%', height: 44, padding: '0 16px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
          </form>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ background: '#f5f5f7', borderRadius: 12, height: 300, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>No designs found</h3>
              <Link href="/shop" style={{ color: 'var(--brand-accent)' }}>Browse All</Link>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 48 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Link key={p}
                      href={`/shop?${new URLSearchParams({ ...(category !== 'all' && { category }), ...(search && { search }), page: p.toString() })}`}
                      style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 14, textDecoration: 'none', background: page === p ? 'var(--brand)' : 'transparent', color: page === p ? 'white' : 'var(--text)', border: `1px solid ${page === p ? 'transparent' : 'var(--border)'}` }}>
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
