'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CATEGORIES } from '@/types'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <style>{`
        .nav-desktop-cats { display: flex; }
        .nav-hamburger { display: none; }
        @media (max-width: 768px) {
          .nav-desktop-cats { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'white', borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
          {/* Logo */}
          <Link href="/" style={{ fontWeight: 900, fontSize: 22, textDecoration: 'none', color: 'var(--brand)', flexShrink: 0 }}>
            tik<span style={{ color: 'var(--brand-accent)' }}>life</span>
          </Link>

          {/* Desktop categories */}
          <nav className="nav-desktop-cats" style={{ flex: 1, gap: 2, overflow: 'hidden' }}>
            {CATEGORIES.slice(1, 7).map(cat => (
              <Link key={cat.value} href={`/shop?category=${cat.value}`}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
            <Link href="/shop" style={{
              height: 38, padding: '0 18px', borderRadius: 9,
              background: 'var(--brand-accent)', color: 'white',
              fontWeight: 700, fontSize: 13, textDecoration: 'none',
              display: 'flex', alignItems: 'center',
            }}>
              Browse
            </Link>

            {/* Hamburger */}
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'none', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 18 }}>{menuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid var(--border)', background: 'white',
            padding: '12px 16px 20px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {CATEGORIES.slice(1).map(cat => (
                <Link key={cat.value} href={`/shop?category=${cat.value}`}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', color: 'var(--text)',
                    background: '#f8f8fa', display: 'block',
                  }}>
                  {cat.label}
                </Link>
              ))}
            </div>
            <Link href="/shop" onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', marginTop: 12, height: 48, borderRadius: 12,
                background: 'var(--brand-accent)', color: 'white',
                fontWeight: 700, fontSize: 15, textDecoration: 'none',
                textAlign: 'center', lineHeight: '48px',
              }}>
              Browse All Designs →
            </Link>
          </div>
        )}
      </header>
    </>
  )
}
