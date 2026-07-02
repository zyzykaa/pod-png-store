'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'

interface Props {
  productId: string
  category: string
  currentPrice: number
}

export default function RelatedProducts({ productId, category, currentPrice }: Props) {
  const [related, setRelated] = useState<Product[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    fetch(`/api/products/related?product_id=${productId}&category=${category}&limit=4`)
      .then(r => r.json())
      .then(d => setRelated(d.data || []))
      .finally(() => setLoading(false))
  }, [productId, category])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addSelectedToCart() {
    related.filter(p => selected.has(p.id)).forEach(p => addItem(p))
    setSelected(new Set())
  }

  if (loading || related.length === 0) return null

  const selectedProducts = related.filter(p => selected.has(p.id))
  const bundleSubtotal = currentPrice + selectedProducts.reduce((s, p) => s + p.price, 0)
  const discountPct = selected.size === 0 ? 0 : selected.size === 1 ? 10 : selected.size === 2 ? 15 : 20
  const bundleTotal = bundleSubtotal * (1 - discountPct / 100)
  const youSave = bundleSubtotal - bundleTotal

  return (
    <div style={{
      marginTop: 32, padding: 20, borderRadius: 16,
      background: 'linear-gradient(135deg, #fff7ed, #fef2f4)',
      border: '1.5px solid #fde4cf',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>🔥</span>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Frequently Bought Together</h3>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        Bundle and save up to 20% — select designs below
      </p>

      {/* 1 hàng ngang — 4 cột */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {related.map(p => {
          const isChecked = selected.has(p.id)
          return (
            <div
              key={p.id}
              onClick={() => toggle(p.id)}
              style={{
                position: 'relative', borderRadius: 12, background: 'white',
                border: `2px solid ${isChecked ? '#e94560' : '#f0f0f0'}`,
                cursor: 'pointer', overflow: 'hidden',
                boxShadow: isChecked ? '0 0 0 3px rgba(233,69,96,0.12)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Checkbox badge */}
              <div style={{
                position: 'absolute', top: 8, left: 8, zIndex: 2,
                width: 22, height: 22, borderRadius: 6,
                background: isChecked ? '#e94560' : 'white',
                border: `2px solid ${isChecked ? '#e94560' : '#ccc'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                transition: 'background 0.15s, border-color 0.15s',
              }}>
                {isChecked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* Image */}
              <div style={{ aspectRatio: '1', background: '#f8f8fa', padding: 8 }}>
                <img
                  src={p.preview_url}
                  alt={p.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>

              {/* Info */}
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: '#333',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', lineHeight: 1.4, marginBottom: 6, minHeight: 30,
                }}>
                  {p.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#e94560' }}>
                    +${p.price.toFixed(2)}
                  </span>
                  {isChecked && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#16a34a',
                      background: '#dcfce7', padding: '2px 7px', borderRadius: 20,
                    }}>
                      Added ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bundle summary */}
      {selected.size > 0 && (
        <div style={{
          background: 'white', borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          border: '1.5px dashed #e94560',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginBottom: 4 }}>
            <span>Subtotal ({selected.size + 1} designs)</span>
            <span style={{ textDecoration: 'line-through' }}>${bundleSubtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              Bundle price{' '}
              <span style={{ color: '#16a34a', fontSize: 12 }}>(-{discountPct}%)</span>
            </span>
            <span style={{ fontWeight: 900, fontSize: 20, color: '#e94560' }}>${bundleTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
            You save ${youSave.toFixed(2)} 🎉
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <button
          onClick={addSelectedToCart}
          style={{
            width: '100%', height: 46, borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #e94560, #c23050)',
            color: 'white', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(233,69,96,0.3)',
          }}
        >
          Add {selected.size} design{selected.size > 1 ? 's' : ''} to cart →
        </button>
      )}
    </div>
  )
}
