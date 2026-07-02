'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { CATEGORIES } from '@/types'
import { useCart } from '@/hooks/useCart'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const cartRef = useRef<HTMLDivElement>(null)

  const { items, subtotal, total, bundleDiscountRate, bundleDiscountAmount, removeItem, count } = useCart()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false)
      }
    }
    if (cartOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [cartOpen])

  const itemCount = mounted ? count() : 0
  const rate = mounted ? bundleDiscountRate() : 0

  return (
    <>
      <style>{`
        .nav-desktop { display: flex; }
        .nav-hamburger { display: none !important; }
        .nav-tagline { display: flex; }
        .nav-browse-btn { display: flex; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-tagline { display: none !important; }
          .nav-browse-btn { display: none !important; }
        }
      `}</style>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 62, gap: 16 }}>

          {/* Logo + tagline */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 22, color: '#1a1a2e', letterSpacing: '-0.5px', lineHeight: 1 }}>
              tik<span style={{ color: '#e94560' }}>life</span>
            </span>
            <span className="nav-tagline" style={{
              fontSize: 11, fontWeight: 600, color: '#aaa',
              borderLeft: '1.5px solid #e5e5e5', paddingLeft: 10,
              lineHeight: 1.45,
            }}>
              PNG Designs<br />for POD Sellers
            </span>
          </Link>

          {/* Desktop categories */}
          <nav className="nav-desktop" style={{ flex: 1, gap: 2, overflow: 'hidden' }}>
            {CATEGORIES.slice(1, 8).map(cat => (
              <Link key={cat.value} href={`/shop?category=${cat.value}`}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', color: '#666',
                  whiteSpace: 'nowrap',
                }}>
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* Browse button */}
          <Link href="/shop" className="nav-browse-btn" style={{
            height: 38, padding: '0 20px', borderRadius: 9,
            background: '#e94560', color: 'white',
            fontWeight: 700, fontSize: 13, textDecoration: 'none',
            alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            Browse →
          </Link>

          {/* Cart icon + dropdown */}
          <div ref={cartRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { setCartOpen(o => !o); setMenuOpen(false) }}
              style={{
                position: 'relative', background: itemCount > 0 ? '#fff5f6' : 'none',
                border: `1.5px solid ${itemCount > 0 ? '#fecdd3' : '#e5e5e5'}`,
                borderRadius: 10, padding: '7px 12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <span style={{ fontSize: 17 }}>🛒</span>
              {itemCount > 0 && (
                <>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e94560' }}>
                    ${mounted ? total().toFixed(2) : '0.00'}
                  </span>
                  <div style={{
                    position: 'absolute', top: -7, right: -7,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#e94560', color: 'white',
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white',
                  }}>
                    {itemCount}
                  </div>
                </>
              )}
            </button>

            {/* Dropdown */}
            {cartOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: 360, background: 'white', borderRadius: 16,
                boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
                border: '1px solid #f0f0f0', overflow: 'hidden', zIndex: 200,
              }}>
                {itemCount === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>🛒</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Your cart is empty</div>
                    <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>Add some designs to get started</div>
                    <Link href="/shop" onClick={() => setCartOpen(false)}
                      style={{
                        display: 'inline-block', padding: '9px 22px', borderRadius: 9,
                        background: '#e94560', color: 'white', fontWeight: 700,
                        fontSize: 13, textDecoration: 'none',
                      }}>
                      Browse designs →
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Bundle discount banner */}
                    {rate > 0 && (
                      <div style={{
                        background: 'linear-gradient(90deg, #16a34a, #15803d)',
                        color: 'white', fontSize: 12, fontWeight: 700,
                        padding: '7px 16px', textAlign: 'center',
                      }}>
                        🎉 {(rate * 100).toFixed(0)}% bundle discount applied — you save ${mounted ? bundleDiscountAmount().toFixed(2) : '0.00'}!
                      </div>
                    )}

                    {/* Item list */}
                    <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 16px' }}>
                      {items.map((item, idx) => (
                        <div key={item.product.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                          borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none',
                        }}>
                          <img src={item.product.preview_url} alt={item.product.title}
                            style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, background: '#f8f8fa', flexShrink: 0 }} />
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
                    </div>

                    {/* Summary + checkout */}
                    <div style={{ padding: '12px 16px 16px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                      {rate > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 4 }}>
                            <span>Subtotal</span>
                            <span>${mounted ? subtotal().toFixed(2) : '0.00'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', fontWeight: 700, marginBottom: 10 }}>
                            <span>Bundle discount ({(rate * 100).toFixed(0)}% off)</span>
                            <span>-${mounted ? bundleDiscountAmount().toFixed(2) : '0.00'}</span>
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
                        <span>Total</span>
                        <span style={{ color: '#e94560' }}>${mounted ? total().toFixed(2) : '0.00'}</span>
                      </div>
                      <Link href="/checkout" onClick={() => setCartOpen(false)}
                        style={{
                          display: 'block', textAlign: 'center', height: 46, lineHeight: '46px',
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #e94560, #c23050)',
                          color: 'white', fontWeight: 700, fontSize: 14,
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(233,69,96,0.3)',
                        }}>
                        Checkout →
                      </Link>
                      {rate === 0 && itemCount === 1 && (
                        <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 }}>
                          💡 Add 1 more design to get 10% off!
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger - mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => { setMenuOpen(o => !o); setCartOpen(false) }}
            style={{
              background: 'none', border: '1.5px solid #e5e5e5',
              borderRadius: 8, padding: '7px 10px',
              cursor: 'pointer', alignItems: 'center', fontSize: 18,
            }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid #f0f0f0', background: 'white', padding: '12px 16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {CATEGORIES.slice(1).map(cat => (
                <Link key={cat.value} href={`/shop?category=${cat.value}`}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, fontSize: 13,
                    fontWeight: 600, textDecoration: 'none', color: '#333',
                    background: '#f8f8fa', display: 'block',
                  }}>
                  {cat.label}
                </Link>
              ))}
            </div>
            <Link href="/shop" onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', marginTop: 10, height: 48, borderRadius: 12,
                background: '#e94560', color: 'white', fontWeight: 700,
                fontSize: 15, textDecoration: 'none', textAlign: 'center', lineHeight: '48px',
              }}>
              Browse All Designs →
            </Link>
          </div>
        )}
      </header>
    </>
  )
}
