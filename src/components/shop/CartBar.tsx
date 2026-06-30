'use client'

import { useCart } from '@/hooks/useCart'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CartBar() {
  const { items, total, removeItem } = useCart()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Tranh hydration mismatch voi zustand persist
  useEffect(() => setMounted(true), [])
  if (!mounted || items.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'white', borderTop: '1.5px solid #f0f0f0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
    }}>
      {expanded && (
        <div style={{ maxHeight: 260, overflowY: 'auto', borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={item.product.preview_url} alt={item.product.title}
                  style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: '#f8f8fa', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product.title}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e94560' }}>${item.product.price.toFixed(2)}</span>
                <button onClick={() => removeItem(item.product.id)}
                  style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: 16 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#e94560',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13,
          }}>
            {items.length}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {items.length} design{items.length > 1 ? 's' : ''} in cart
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {expanded ? 'Tap to collapse' : 'Tap to view'}
            </div>
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#e94560' }}>${total().toFixed(2)}</span>
          <Link href="/checkout" style={{
            height: 44, padding: '0 24px', borderRadius: 10,
            background: '#e94560', color: 'white', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', display: 'flex', alignItems: 'center',
          }}>
            Checkout →
          </Link>
        </div>
      </div>
    </div>
  )
}
