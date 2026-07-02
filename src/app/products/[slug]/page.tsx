import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import ProductCheckout from '@/components/shop/ProductCheckout'
import ProductImage from '@/components/shop/ProductImage'
import RelatedProducts from '@/components/shop/RelatedProducts'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  const ogImage = product.preview_url || 'https://tiklife.shop/og-image.jpg'
  return {
    title: `${product.title} | Tiklife`,
    description: product.description || `Download ${product.title} — 300 DPI PNG, commercial license included.`,
    openGraph: {
      title: product.title,
      description: `$${product.price} · 300 DPI · Commercial License · Instant Download`,
      images: [{ url: ogImage, width: 1200, height: 1200, alt: product.title }],
    },
    twitter: { card: 'summary_large_image', title: product.title, images: [ogImage] },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

      <div className='product-layout' style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: 48, alignItems: 'start' }}>
        {/* Left: Images - client component để dùng event handlers */}
        <div>
          <ProductImage previewUrl={product.preview_url} title={product.title} />

          {/* Mockups */}
          {product.mockup_urls?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
              {product.mockup_urls.map((url: string, i: number) => (
                <div key={i} style={{ background: '#f5f5f7', borderRadius: 10, overflow: 'hidden', aspectRatio: '1' }}>
                  <img src={url} alt={`Mockup ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>About this design</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 15 }}>{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.tags.map((tag: string) => (
                <Link key={tag} href={`/shop?search=${tag}`}
                  style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* License */}
          <div style={{ marginTop: 32, padding: 20, borderRadius: 12, border: '1px solid #d1fae5', background: '#f0fdf4' }}>
            <h3 style={{ fontSize: 15, marginBottom: 12, color: '#166534' }}>License included</h3>
            <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.8 }}>
              Use on Printify, Printful, or your own products<br />
              Sell unlimited physical products (shirts, mugs, tumblers...)<br />
              Use for DTF transfers and sublimation
            </div>
          </div>

        </div>

        {/* Right: Checkout */}
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 16, lineHeight: 1.3 }}>{product.title}</h1>
          <ProductCheckout product={product} />
        </div>
      </div>

      {/* Upsell: Frequently Bought Together — full width */}
      <RelatedProducts productId={product.id} category={product.category} currentPrice={product.price} />
    </div>
  )
}
