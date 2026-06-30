'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import Link from 'next/link'

interface Props {
  excludeIds: string[]
}

export default function PostPurchaseUpsell({ excludeIds }: Props) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products?sort=popular&limit=4')
      .then(r => r.json())
      .then(d => setProducts((d.data || []).filter((p: Product) => !excludeIds.includes(p.id)).slice(0, 3)))
  }, [excludeIds])

  if (products.length === 0) return null

  return (
    <div style={{
      marginTop: 40, padding: 28, borderRadius: 18,
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: 'white',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, background: '#e94560',
          padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em',
        }}>
          ONE-TIME OFFER
        </span>
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
        Get 30% off your next design
      </h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
        Since you're already here — grab another bestseller before this offer disappears.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {products.map(p => (
          <Link key={p.id} href={`/products/${p.slug}`} style={{ textDecoration: 'none', color: 'white' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.04)' }}>
                <img src={p.preview_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, marginBottom: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#e94560' }}>
                    ${(p.price * 0.7).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 11, textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)' }}>
                    ${p.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link href="/shop" style={{
        display: 'block', textAlign: 'center', height: 46, lineHeight: '46px',
        borderRadius: 10, background: '#e94560', color: 'white',
        fontWeight: 700, fontSize: 14, textDecoration: 'none',
      }}>
        Claim 30% off — use code NEXT30 →
      </Link>
    </div>
  )
}
