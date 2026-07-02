'use client'

import { useCart } from '@/hooks/useCart'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CartBar() {
  const { items, subtotal, total, bundleDiscountRate, bundleDiscountAmount, removeItem } = useCart()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted || items.length === 0) return null

  const rate = bundleDiscountRate()
  const discountAmt = bundleDiscountAmount()
  const finalTotal = total()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'white', borderTop: '1.5px solid #f0f0f0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
    }}>
      {/* Bundle discount banner */}
      {rate > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #16a34a, #15803d)',
          color: 'white', textAlign: 'center',
          fontSize: 12, fontWeight: 700, padding: '5px 0',
          letterSpacing: '0.02em',
        }}>
          🎉 Bundle discount {(rate * 100).toFixed(0)}% off applied — you save ${discountAmt.toFixed(2)}!
        </div>
      )}

      {/* Expanded: item list */}
      {expanded && (
        <div style={{ maxHeight: 280, overflowY: 'auto', borderBottom: '1px solid #f0f0f0' }}>
          <div className="container" style={{ padding: '10px 24px' }}>
            {items.map((item, idx) => (
              <div key={item.product.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none',
              }}>
                <img src={item.product.preview_url} alt={item.product.title}
                  style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#f8f8fa', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{item.product.category}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e94560', flexShrink: 0 }}>
                  ${item.product.price.toFixed(2)}
                </div>
                <button onClick={() => removeItem(item.product.id)}
                  style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 20, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>
                  ×
                </button>
              </div>
            ))}

            {/* Discount summary in expanded view */}
            {rate > 0 && (
              <div style={{ padding: '10px 0 4px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 }}>
                  <span>Subtotal</span>
                  <span>${subtotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', fontWeight: 700 }}>
                  <span>Bundle discount ({(rate * 100).toFixed(0)}% off)</span>
                  <span>-${discountAmt.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 68, gap: 16 }}>
        {/* Left: toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', flex: 1, minWidth: 0, textAlign: 'left', padding: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #e94560, #c23050)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              🛒
            </div>
            <div style={{
              position: 'absolute', top: -6, right: -6,
              width: 18, height: 18, borderRadius: '50%',
              background: '#1a1a2e', color: 'white',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white',
            }}>
              {items.length}
            </div>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap' }}>
              {items.length} design{items.length > 1 ? 's' : ''} in cart
            </div>
            <div style={{ fontSize: 11, color: rate > 0 ? '#16a34a' : '#aaa', fontWeight: rate > 0 ? 600 : 400 }}>
              {rate > 0 ? `${(rate * 100).toFixed(0)}% bundle discount · ` : ''}{expanded ? 'Hide ▲' : 'View all ▼'}
            </div>
          </div>
        </button>

        {/* Right: total + checkout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#e94560', lineHeight: 1.1 }}>
              ${finalTotal.toFixed(2)}
            </div>
            {rate > 0 && (
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                Saved ${discountAmt.toFixed(2)}
              </div>
            )}
          </div>
          <Link href="/checkout" style={{
            height: 46, padding: '0 22px', borderRadius: 12,
            background: 'linear-gradient(135deg, #e94560, #c23050)',
            color: 'white', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 4px 14px rgba(233,69,96,0.3)',
            whiteSpace: 'nowrap',
          }}>
            Checkout →
          </Link>
        </div>
      </div>
    </div>
  )
}
