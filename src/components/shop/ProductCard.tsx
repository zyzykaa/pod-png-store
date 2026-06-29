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
    <>
      <style>{`
        .product-card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 8px;
        }
        .product-card-info {
          padding: 12px 14px;
        }
        .product-card-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
          min-height: 2.8em;
        }
        .product-card-price {
          font-size: 18px;
          font-weight: 700;
          color: var(--brand-accent);
        }
        .product-card-meta {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .product-card-img { padding: 4px; }
          .product-card-info { padding: 8px 10px; }
          .product-card-title {
            font-size: 12px;
            min-height: 2.6em;
            margin-bottom: 4px;
          }
          .product-card-price { font-size: 15px; }
          .product-card-meta { display: none; }
          .product-card-tags { display: none; }
        }
      `}</style>

      <Link href={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{
          background: 'white', borderRadius: 12,
          overflow: 'hidden', border: '1px solid var(--border)',
        }}>
          {/* Image - aspect ratio 1:1, contain de khong bi crop */}
          <div style={{
            position: 'relative',
            aspectRatio: '1',
            background: '#f5f5f7',
            overflow: 'hidden',
          }}>
            {discountPct && (
              <div style={{
                position: 'absolute', top: 6, left: 6, zIndex: 10,
                background: 'var(--brand-accent)', color: 'white',
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
              }}>
                {discountPct}% OFF
              </div>
            )}
            {product.is_featured && (
              <div style={{
                position: 'absolute', top: 6, right: 6, zIndex: 10,
                background: '#f59e0b', color: 'white',
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
              }}>
                HOT
              </div>
            )}
            <img
              src={product.preview_url}
              alt={product.title}
              className="product-card-img"
            />
          </div>

          {/* Info */}
          <div className="product-card-info">
            <div className="product-card-title">{product.title}</div>

            {product.tags?.length > 0 && (
              <div className="product-card-tags" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className="product-card-price">${product.price}</span>
              {product.compare_price && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ${product.compare_price}
                </span>
              )}
            </div>

            <div className="product-card-meta">
              <span>📐 {product.file_info?.dpi || 300} DPI</span>
              <span>🎨 PNG</span>
              <span>✅ Commercial</span>
            </div>
          </div>
        </div>
      </Link>
    </>
  )
}
