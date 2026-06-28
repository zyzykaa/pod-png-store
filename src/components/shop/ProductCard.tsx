import Link from 'next/link'
import { Product } from '@/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const discountPct = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null

  return (
    <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        background: 'white', borderRadius: 12,
        overflow: 'hidden', border: '1px solid var(--border)',
        transition: 'box-shadow 0.2s',
      }}>
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '1', background: '#f5f5f7', overflow: 'hidden' }}>
          {discountPct && (
            <div style={{
              position: 'absolute', top: 10, left: 10, zIndex: 10,
              background: 'var(--brand-accent)', color: 'white',
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            }}>
              {discountPct}% OFF
            </div>
          )}
          {product.is_featured && (
            <div style={{
              position: 'absolute', top: 10, right: 10, zIndex: 10,
              background: '#f59e0b', color: 'white',
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            }}>
              HOT
            </div>
          )}
          <img
            src={product.preview_url}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{
            fontSize: 13, fontWeight: 600, marginBottom: 6,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            lineHeight: 1.4, minHeight: '2.8em',
          }}>
            {product.title}
          </div>

          {product.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {product.tags.slice(0, 2).map((tag: string) => (
                <span key={tag} style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: '#f3f4f6', color: '#6b7280',
                }}>
                  {tag.toUpperCase()}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-accent)' }}>
              ${product.price}
            </span>
            {product.compare_price && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                ${product.compare_price}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>📐 {product.file_info?.dpi || 300} DPI</span>
            <span>🎨 PNG</span>
            <span>✅ Commercial use</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
