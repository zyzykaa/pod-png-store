'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CATEGORIES } from '@/types'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Top bar - sale banner */}
      <div style={{
        background: 'var(--brand)',
        color: 'white',
        textAlign: 'center',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 500,
      }}>
        🔥 New designs added weekly — All files 300 DPI · Commercial License Included
      </div>

      {/* Main nav */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 60,
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontWeight: 800,
          fontSize: 20,
          color: 'var(--brand)',
          textDecoration: 'none',
          letterSpacing: '-0.04em',
        }}>
          tik<span style={{ color: 'var(--brand-accent)' }}>life</span>
        </Link>

        {/* Search bar */}
        <div style={{ flex: 1, maxWidth: 400, margin: '0 32px' }}>
          <form action="/shop" method="get">
            <div style={{ position: 'relative' }}>
              <input
                name="search"
                placeholder="Search designs..."
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 16px 0 38px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 20,
                  fontSize: 14,
                  background: 'var(--bg-soft)',
                  outline: 'none',
                }}
              />
              <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
          </form>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/shop" className="btn btn-secondary" style={{ height: 36, fontSize: 13 }}>
            All Designs
          </Link>
          <Link href="/shop?category=christmas" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
            textDecoration: 'none', padding: '0 12px',
          }}>
            Christmas
          </Link>
          <Link href="/shop?category=western" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
            textDecoration: 'none', padding: '0 12px',
          }}>
            Western
          </Link>
          <Link href="/shop?category=mama" style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
            textDecoration: 'none', padding: '0 12px',
          }}>
            Mama
          </Link>
        </nav>
      </div>

      {/* Category scroll bar */}
      <div style={{
        borderTop: '1px solid var(--border)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '8px 24px',
          minWidth: 'max-content',
        }}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              href={cat.value === 'all' ? '/shop' : `/shop?category=${cat.value}`}
              style={{
                padding: '4px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                textDecoration: 'none',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                border: '1px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'var(--bg-soft)'
                el.style.borderColor = 'var(--border)'
                el.style.color = 'var(--text)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'transparent'
                el.style.borderColor = 'transparent'
                el.style.color = 'var(--text-muted)'
              }}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
