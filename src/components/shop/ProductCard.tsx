import Link from 'next/link'
import { getImageUrl } from '@/lib/image'
import Image from 'next/image'
import { Product } from '@/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const hasDiscount = product.compare_price && product.compare_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_price!) * 100)
    : 0

  return (
    <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer' }}>
        {/* Preview image */}
        <div style={{ position: 'relative', aspectRatio: '1', background: '#f5f5f7', overflow: 'hidden' }}>
          <img
            src={getImageUrl(product.preview_url)}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Badges */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {hasDiscount && (
              <span className="badge badge-sale">{discountPct}% OFF</span>
            )}
            {product.is_featured && (
              <span className="badge badge-featured">⭐ Hot</span>
            )}
          </div>

          {/* Quick buy overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            padding: '24px 12px 12px',
            transform: 'translateY(100%)',
            transition: 'transform 0.2s ease',
          }}
          className="card-overlay">
            <div style={{
              background: 'var(--brand-accent)', color: 'white',
              borderRadius: 8, padding: '8px', textAlign: 'center',
              fontSize: 13, fontWeight: 600,
            }}>
              Buy Now — ${product.price.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px' }}>
          <h3 style={{
            fontSize: 13, fontWeight: 500, lineHeight: 1.4,
            margin: '0 0 8px',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            color: 'var(--text)',
          }}>
            {product.title}
          </h3>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: 'var(--bg-soft)', color: 'var(--text-muted)',
                fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="price-current">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="price-original">${product.compare_price!.toFixed(2)}</span>
            )}
          </div>

          {/* File info */}
          <div style={{
            marginTop: 8, fontSize: 11, color: 'var(--text-muted)',
            display: 'flex', gap: 8,
          }}>
            <span>📐 {product.file_info?.dpi || 300} DPI</span>
            <span>🎨 PNG</span>
            <span>✅ Commercial use</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
