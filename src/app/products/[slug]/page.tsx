import { notFound } from 'next/navigation'
import { getImageUrl } from '@/lib/image'
import { supabaseAdmin } from '@/lib/supabase'
import ProductCheckout from '@/components/shop/ProductCheckout'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('title, description, preview_url, price')
    .eq('slug', slug)
    .single()

  if (!product) return {}

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tiklife.shop'
  const ogImage = product.preview_url || `${BASE_URL}/og-image.jpg`

  return {
    title: `${product.title} | Tiklife`,
    description: product.description || `Download ${product.title} — 300 DPI PNG, commercial license included. Instant digital download.`,
    openGraph: {
      title: product.title,
      description: `$${product.price} · 300 DPI · Commercial License · Instant Download`,
      images: [{ url: ogImage, width: 1200, height: 1200, alt: product.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      images: [ogImage],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, display: 'flex', gap: 8 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link href="/shop" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Shop</Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          {product.category}
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{product.title.split('|')[0].trim()}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' }}>
        {/* Left: Images */}
        <div>
          {/* Main preview */}
          <div style={{
            background: '#f5f5f7', borderRadius: 16, overflow: 'hidden',
            marginBottom: 16, position: 'relative', aspectRatio: '1',
          }}>
            <img
              src={getImageUrl(product.preview_url)}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {/* Watermark overlay */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%) rotate(-30deg)',
              fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.3)',
              letterSpacing: 4, pointerEvents: 'none', userSelect: 'none',
            }}>
              PREVIEW
            </div>
          </div>

          {/* Mockup images */}
          {product.mockup_urls?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {product.mockup_urls.map((url: string, i: number) => (
                <div key={i} style={{
                  background: '#f5f5f7', borderRadius: 10,
                  overflow: 'hidden', aspectRatio: '1',
                }}>
                  <img src={url} alt={`Mockup ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>About this design</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 15 }}>
              {product.description}
            </p>
          </div>

          {/* Tags */}
          <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {product.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/shop?search=${tag}`}
                style={{
                  padding: '6px 14px', borderRadius: 20,
                  border: '1px solid var(--border)',
                  fontSize: 13, color: 'var(--text-muted)',
                  textDecoration: 'none',
                }}
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* License info */}
          <div style={{
            marginTop: 32, padding: 20, borderRadius: 12,
            border: '1px solid #d1fae5', background: '#f0fdf4',
          }}>
            <h3 style={{ fontSize: 15, marginBottom: 12, color: '#166534' }}>✅ License included</h3>
            <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.8 }}>
              ✓ Use on Printify, Printful, or your own products<br />
              ✓ Sell unlimited physical products (shirts, mugs, tumblers...)<br />
              ✓ Use for DTF transfers and sublimation<br />
              ✗ Cannot resell the digital file itself<br />
              ✗ Cannot upload to stock/design marketplace
            </div>
          </div>
        </div>

        {/* Right: Checkout */}
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 16, lineHeight: 1.3 }}>{product.title}</h1>
          <ProductCheckout product={product} />
        </div>
      </div>
    </div>
  )
}
