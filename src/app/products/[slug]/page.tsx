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
  const productUrl = `https://tiklife.shop/products/${slug}`

  // Dùng SEO fields nếu có, fallback về title/description mặc định
  const metaTitle = product.seo_title
    ? `${product.seo_title} | Tiklife`
    : `${product.title} | Tiklife`
  const metaDescription = product.seo_description
    || product.description
    || `Download ${product.title} — 300 DPI PNG, transparent background, commercial license included. Works on Printify, Printful & Etsy POD.`

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      type: 'website',
      url: productUrl,
      siteName: 'Tiklife',
      title: product.seo_title || product.title,
      description: metaDescription,
      images: [{
        url: ogImage,
        width: 1000,
        height: 1000,
        alt: product.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.seo_title || product.title,
      description: metaDescription,
      images: [ogImage],
    },
    // Pinterest Product Rich Pin meta tags
    other: {
      'og:url': productUrl,
      'product:price:amount': product.price.toFixed(2),
      'product:price:currency': 'USD',
      'og:availability': 'in stock',
      'og:condition': 'new',
      'og:brand': 'Tiklife',
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const productUrl = `https://tiklife.shop/products/${slug}`
  const pinTitle = (product.seo_title || product.title).slice(0, 50)
  const pinterestShareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(product.preview_url)}&description=${encodeURIComponent(`${pinTitle} | $${product.price} · 300 DPI PNG for POD. Commercial license included. #PODdesign #sublimation #DTF #printify #printful`)}`

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
        {/* Left: Images */}
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

        </div>

        {/* Right: Checkout + License + Pinterest */}
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 16, lineHeight: 1.3 }}>{product.title}</h1>
          <ProductCheckout product={product} />

          {/* License */}
          <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: '1px solid #d1fae5', background: '#f0fdf4' }}>
            <h3 style={{ fontSize: 14, marginBottom: 8, color: '#166534' }}>License included</h3>
            <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.8 }}>
              ✓ Use on Printify, Printful, or your own products<br />
              ✓ Sell unlimited physical products (shirts, mugs, tumblers...)<br />
              ✓ Use for DTF transfers and sublimation
            </div>
          </div>

          {/* Pinterest share */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Share:</span>
            <a
              href={pinterestShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                height: 34, padding: '0 14px', borderRadius: 8,
                background: '#E60023', color: 'white',
                fontWeight: 700, fontSize: 12, textDecoration: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
              Save to Pinterest
            </a>
          </div>
        </div>
      </div>

      {/* Upsell: Frequently Bought Together — full width */}
      <RelatedProducts productId={product.id} category={product.category} currentPrice={product.price} />
    </div>
  )
}
