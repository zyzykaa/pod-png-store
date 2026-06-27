import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import ProductCard from '@/components/shop/ProductCard'
import { Product, CATEGORIES } from '@/types'

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8)
    return data || []
  } catch { return [] }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <div>
      {/* HERO */}
      <section style={{
        background: 'var(--brand)',
        color: 'white',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div className="container">
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 60px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: 16,
            lineHeight: 1.1,
          }}>
            Premium PNG Designs<br />
            <span style={{ color: 'var(--brand-accent)' }}>for Sublimation & DTF</span>
          </h1>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.7)',
            maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6,
          }}>
            Instant digital download. 300 DPI transparent PNG. Commercial license included.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn" style={{
              background: 'var(--brand-accent)', color: 'white', height: 52, fontSize: 16, padding: '0 32px',
            }}>
              Browse All Designs →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
            {[['⚡','Instant Download'],['📐','300 DPI Files'],['✅','Commercial License'],['🎨','New Designs Weekly']].map(([icon,label]) => (
              <div key={label as string} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: 'center' }}>Shop by Category</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {CATEGORIES.slice(1).map(cat => (
              <Link key={cat.value} href={`/shop?category=${cat.value}`} style={{
                display: 'block', padding: '16px 12px', borderRadius: 12,
                border: '1px solid var(--border)', textAlign: 'center',
                textDecoration: 'none', color: 'var(--text)', fontSize: 13, fontWeight: 500,
              }}>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-soft)', paddingTop: 48 }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 28 }}>⭐ Featured Designs</h2>
              <Link href="/shop" className="btn btn-secondary" style={{ height: 38, fontSize: 13 }}>View all →</Link>
            </div>
            <div className="product-grid">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, marginBottom: 48 }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { step: '1', title: 'Choose a design', desc: 'Browse hundreds of high-quality PNG designs across all niches.' },
              { step: '2', title: 'Pay with PayPal', desc: 'Secure checkout. No account needed. Instant confirmation.' },
              { step: '3', title: 'Instant download', desc: 'Get your files immediately. 300 DPI PNG with transparent background.' },
              { step: '4', title: 'Start selling', desc: 'Use on Printify, Printful, your heat press, or DTF printer.' },
            ].map(item => (
              <div key={item.step} style={{ padding: '24px 16px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--brand)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, margin: '0 auto 16px',
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
