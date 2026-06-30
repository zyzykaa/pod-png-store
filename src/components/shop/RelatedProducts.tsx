'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

interface Props {
  productId: string
  category: string
  currentPrice: number
}

export default function RelatedProducts({ productId, category, currentPrice }: Props) {
  const [related, setRelated] = useState<Product[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const { addItem, items } = useCart()

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
    const toAdd = related.filter(p => selected.has(p.id))
    toAdd.forEach(p => addItem(p))
    setSelected(new Set())
  }

  if (loading || related.length === 0) return null

  const selectedProducts = related.filter(p => selected.has(p.id))
  const bundleSubtotal = currentPrice + selectedProducts.reduce((s, p) => s + p.price, 0)
  // Discount tang theo so luong them: 1 item +10%, 2 items +15%, 3+ items +20%
  const discountPct = selected.size === 0 ? 0 : selected.size === 1 ? 10 : selected.size === 2 ? 15 : 20
  const bundleTotal = bundleSubtotal * (1 - discountPct / 100)
  const youSave = bundleSubtotal - bundleTotal

  return (
    <div style={{
      marginTop: 32, padding: 24, borderRadius: 16,
      background: 'linear-gradient(135deg, #fff7ed, #fef2f4)',
      border: '1.5px solid #fde4cf',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20 }}>🔥</span>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Frequently Bought Together</h3>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
        Sellers who buy this design often add these too — bundle and save up to 20%
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {related.map(p => {
          const isChecked = selected.has(p.id)
          return (
            <label key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12,
                background: 'white', cursor: 'pointer',
                border: isChecked ? '1.5px solid #e94560' : '1.5px solid #f0f0f0',
                transition: 'border-color 0.15s',
              }}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(p.id)}
                style={{ width: 18, height: 18, accentColor: '#e94560', cursor: 'pointer', flexShrink: 0 }}
              />
              <img src={p.preview_url} alt={p.title}
                style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, background: '#f8f8fa', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e94560', flexShrink: 0 }}>
                +${p.price.toFixed(2)}
              </div>
            </label>
          )
        })}
      </div>

      {selected.size > 0 && (
        <div style={{
          background: 'white', borderRadius: 12, padding: '14px 16px', marginBottom: 14,
          border: '1.5px dashed #e94560',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Subtotal ({selected.size + 1} designs)</span>
            <span style={{ textDecoration: 'line-through' }}>${bundleSubtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Bundle price <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>(-{discountPct}%)</span>
            </span>
            <span style={{ fontWeight: 900, fontSize: 22, color: '#e94560' }}>${bundleTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
            You save ${youSave.toFixed(2)} 🎉
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <button
          onClick={addSelectedToCart}
          style={{
            width: '100%', height: 46, borderRadius: 12, border: 'none',
            background: '#e94560', color: 'white', fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
          }}>
          Add {selected.size} design{selected.size > 1 ? 's' : ''} to cart →
        </button>
      )}
    </div>
  )
}
