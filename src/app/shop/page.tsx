'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import ProductCard from '@/components/shop/ProductCard'
import { Product, CATEGORIES } from '@/types'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'newest', label: '✨ Newest First' },
  { value: 'popular', label: '🔥 Most Popular' },
  { value: 'featured', label: '⭐ Featured' },
  { value: 'price_asc', label: '💰 Price: Low to High' },
  { value: 'price_desc', label: '💎 Price: High to Low' },
]

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: 999 },
  { label: 'Under $3', min: 0, max: 2.99 },
  { label: '$3 – $5', min: 3, max: 5 },
  { label: '$5 – $10', min: 5, max: 10 },
  { label: 'Over $10', min: 10, max: 999 },
]

function ShopContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'newest'
  const priceRange = searchParams.get('price') || '0'
  const page = parseInt(searchParams.get('page') || '1')

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(search)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const selectedPrice = PRICE_RANGES[parseInt(priceRange)] || PRICE_RANGES[0]
  const totalPages = Math.ceil(total / 24)

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'all' || v === '0') params.delete(k)
      else params.set(k, v)
    })
    params.delete('page')
    router.push('/shop?' + params.toString())
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (search) params.set('search', search)
    if (sort !== 'newest') params.set('sort', sort)
    params.set('min_price', selectedPrice.min.toString())
    params.set('max_price', selectedPrice.max.toString())
    params.set('page', page.toString())

    const res = await fetch('/api/products?' + params)
    const d = await res.json()
    setProducts(d.data || [])
    setTotal(d.pagination?.total || 0)
    setLoading(false)
  }, [category, search, sort, priceRange, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setSearchInput(search) }, [search])

  const activeFilters = [
    category !== 'all' && { key: 'category', label: CATEGORIES.find(c => c.value === category)?.label },
    sort !== 'newest' && { key: 'sort', label: SORT_OPTIONS.find(s => s.value === sort)?.label },
    priceRange !== '0' && { key: 'price', label: selectedPrice.label },
  ].filter(Boolean) as { key: string; label: string }[]

  const renderSidebar = () => (
    <>
      {/* Categories */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Categories
        </div>
        {CATEGORIES.map(cat => (
          <button key={cat.value} type="button"
            onClick={() => updateParams({ category: cat.value })}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none',
              cursor: 'pointer', textAlign: 'left', fontSize: 14, marginBottom: 2,
              fontWeight: category === cat.value ? 700 : 400,
              color: category === cat.value ? '#e94560' : 'var(--text)',
              background: category === cat.value ? '#fef2f4' : 'transparent',
            }}>
            {cat.label}
            {category === cat.value && <span style={{ fontSize: 10 }}>✓</span>}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Sort By
        </div>
        {SORT_OPTIONS.map(opt => (
          <button key={opt.value} type="button"
            onClick={() => updateParams({ sort: opt.value })}
            style={{
              display: 'block', width: '100%', padding: '9px 12px', borderRadius: 8,
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, marginBottom: 2,
              fontWeight: sort === opt.value ? 700 : 400,
              color: sort === opt.value ? '#e94560' : 'var(--text)',
              background: sort === opt.value ? '#fef2f4' : 'transparent',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Price */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          Price Range
        </div>
        {PRICE_RANGES.map((range, idx) => (
          <button key={idx} type="button"
            onClick={() => updateParams({ price: idx === 0 ? null : idx.toString() })}
            style={{
              display: 'block', width: '100%', padding: '9px 12px', borderRadius: 8,
              border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, marginBottom: 2,
              fontWeight: parseInt(priceRange) === idx ? 700 : 400,
              color: parseInt(priceRange) === idx ? '#e94560' : 'var(--text)',
              background: parseInt(priceRange) === idx ? '#fef2f4' : 'transparent',
            }}>
            {range.label}
          </button>
        ))}
      </div>
    </>
  )

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          {search ? `Search: "${search}"` : category !== 'all' ? CATEGORIES.find(c => c.value === category)?.label : 'All Designs'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {loading ? 'Loading...' : `${total.toLocaleString()} designs found`}
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={e => { e.preventDefault(); updateParams({ search: searchInput }) }}
        style={{ position: 'relative', marginBottom: 20 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search designs, niches, styles..."
          style={{
            width: '100%', height: 48, padding: '0 120px 0 46px',
            border: '1.5px solid #e5e5e5', borderRadius: 12,
            fontSize: 14, outline: 'none', boxSizing: 'border-box',
            background: 'white',
          }}
        />
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.4 }}>🔍</span>
        <button type="submit" style={{
          position: 'absolute', right: 6, top: 6, bottom: 6,
          padding: '0 16px', borderRadius: 8, border: 'none',
          background: '#e94560', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>Search</button>
      </form>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {activeFilters.map(f => (
            <button key={f.key} type="button"
              onClick={() => updateParams({ [f.key]: null })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: '#fef2f4', color: '#e94560', border: '1px solid #fecdd3', cursor: 'pointer',
              }}>
              {f.label} ×
            </button>
          ))}
          <button type="button" onClick={() => router.push('/shop')} style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: '#f5f5f5', color: '#888', border: '1px solid #e5e5e5', cursor: 'pointer',
          }}>
            Clear all
          </button>
        </div>
      )}

      {/* Mobile filter toggle */}
      <button type="button" onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        className="shop-mobile-filters"
        style={{
          display: 'none', width: '100%', height: 44, borderRadius: 10,
          border: '1.5px solid #e5e5e5', background: 'white', fontSize: 14,
          fontWeight: 600, cursor: 'pointer', marginBottom: 16,
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
        {mobileFilterOpen ? '✕ Close Filters' : '⚙️ Filters & Sort'}
      </button>

      {/* Mobile filter panel */}
      {mobileFilterOpen && (
        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #f0f0f0', marginBottom: 16 }}>
          {renderSidebar()}
        </div>
      )}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside className="shop-sidebar" style={{
          width: 210, flexShrink: 0, position: 'sticky', top: 100,
          background: 'white', borderRadius: 14, padding: 20,
          border: '1px solid #f0f0f0',
        }}>
          {renderSidebar()}
        </aside>

        {/* Products */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                  <div style={{ aspectRatio: '1', background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%' }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ height: 14, background: '#f0f0f0', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 12, background: '#f0f0f0', borderRadius: 4, width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>No designs found</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Try different keywords or filters</p>
              <button type="button" onClick={() => router.push('/shop')} style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#e94560', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Clear filters</button>
            </div>
          ) : (
            <>
              {/* Sort bar (top of results) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {total.toLocaleString()} designs
                </span>
                <select value={sort} onChange={e => updateParams({ sort: e.target.value })}
                  style={{
                    height: 36, padding: '0 10px', borderRadius: 8, border: '1.5px solid #e5e5e5',
                    fontSize: 13, background: 'white', cursor: 'pointer', fontWeight: 500,
                  }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="product-grid">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 48 }}>
                  <button type="button"
                    disabled={page === 1}
                    onClick={() => updateParams({ page: (page - 1).toString() })}
                    style={{ width: 38, height: 38, borderRadius: 8, border: '1.5px solid #e5e5e5', background: 'white', cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page === 1 ? 0.4 : 1, fontSize: 16 }}>
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                    return (
                      <button key={p} type="button"
                        onClick={() => updateParams({ page: p.toString() })}
                        style={{
                          width: 38, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
                          background: page === p ? '#e94560' : 'white',
                          color: page === p ? 'white' : 'var(--text)',
                          fontWeight: page === p ? 700 : 400,
                          boxShadow: page === p ? '0 4px 12px rgba(233,69,96,0.3)' : '0 0 0 1.5px #e5e5e5',
                        }}>
                        {p}
                      </button>
                    )
                  })}
                  <button type="button"
                    disabled={page === totalPages}
                    onClick={() => updateParams({ page: (page + 1).toString() })}
                    style={{ width: 38, height: 38, borderRadius: 8, border: '1.5px solid #e5e5e5', background: 'white', cursor: page < totalPages ? 'pointer' : 'not-allowed', opacity: page === totalPages ? 0.4 : 1, fontSize: 16 }}>
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ padding: 64, textAlign: 'center', color: '#aaa' }}>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  )
}
