'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CATEGORIES } from '@/types'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

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
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 62, gap: 20 }}>

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

          {/* Browse button — ẩn trên mobile (có trong hamburger menu) */}
          <Link href="/shop" className="nav-browse-btn" style={{
            height: 38, padding: '0 20px', borderRadius: 9,
            background: '#e94560', color: 'white',
            fontWeight: 700, fontSize: 13, textDecoration: 'none',
            alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            Browse →
          </Link>

          {/* Hamburger - mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
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
