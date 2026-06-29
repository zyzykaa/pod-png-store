import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import ProductCard from '@/components/shop/ProductCard'
import { Product } from '@/types'
import InfiniteReviews from '@/components/home/InfiniteReviews'

async function getAllProducts(): Promise<Product[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24)
    return data || []
  } catch { return [] }
}

const TRUST_STATS = [
  { number: '300', label: 'DPI Resolution', sub: 'Print-ready quality' },
  { number: '100%', label: 'Commercial License', sub: 'Sell unlimited products' },
  { number: 'PNG', label: 'Transparent Background', sub: 'Works on any color' },
  { number: '⚡', label: 'Instant Download', sub: 'Get files in seconds' },
]

export default async function HomePage() {
  const products = await getAllProducts()

  return (
    <div>
      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        color: 'white',
        padding: 'clamp(60px, 8vw, 100px) 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(233,69,96,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.4)',
            borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 600,
            color: '#fca5a5', marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e94560', display: 'inline-block' }} />
            NEW DESIGNS ADDED WEEKLY
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20,
          }}>
            Premium PNG Designs<br />
            <span style={{ background: 'linear-gradient(135deg, #e94560, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              for POD Sellers
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Ready-to-print designs for Printify, Printful & DTF printing.
            <strong style={{ color: 'rgba(255,255,255,0.9)' }}> 300 DPI · Commercial license · Instant download.</strong>
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link href="/shop" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 54, padding: '0 32px', borderRadius: 12,
              background: '#e94560', color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(233,69,96,0.4)',
            }}>Browse All Designs →</Link>
            <Link href="/shop?category=western" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 54, padding: '0 28px', borderRadius: 12,
              background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
            }}>🤠 Western Collection</Link>
          </div>

          {/* Trust stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
            maxWidth: 700, margin: '0 auto',
            background: 'rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {TRUST_STATS.map((s, i) => (
              <div key={i} style={{ padding: '20px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#e94560' }}>{s.number}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPATIBLE WITH */}
      <section style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0', padding: '18px 24px' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Works with</span>
          {['Printify', 'Printful', 'Gooten', 'DTF Printing', 'Sublimation', 'Cricut'].map(b => (
            <span key={b} style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>{b}</span>
          ))}
        </div>
      </section>

      {/* ALL DESIGNS */}
      {products.length > 0 && (
        <section className="section">
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e94560', letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase' }}>
                  BROWSE COLLECTION
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 800 }}>All PNG Designs</h2>
              </div>
              <Link href="/shop" style={{
                height: 40, padding: '0 20px', borderRadius: 10,
                border: '1.5px solid var(--border)', background: 'white',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                color: 'var(--text)', display: 'inline-flex', alignItems: 'center',
              }}>View all →</Link>
            </div>
            <div className="product-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {products.length >= 24 && (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <Link href="/shop" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 48, padding: '0 32px', borderRadius: 12,
                  background: 'var(--brand)', color: 'white',
                  fontWeight: 700, fontSize: 15, textDecoration: 'none',
                }}>See all designs →</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section style={{ background: '#f8f8fa', padding: '64px 24px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>From design to product in minutes</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              The fastest way to get professional designs for your POD store
            </p>
          </div>
          <div className='how-it-works' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' }}>
            <div className='how-it-works-line' style={{ position: 'absolute', top: 28, left: '12.5%', right: '12.5%', height: 2, background: 'linear-gradient(90deg, #e94560, #f97316)', zIndex: 0 }} />
            {[
              { step: '01', icon: '🎨', title: 'Pick a design', desc: 'Browse 100s of designs. Filter by niche, style, or keyword.' },
              { step: '02', icon: '💳', title: 'Checkout fast', desc: 'Pay with PayPal. No account required. Takes 30 seconds.' },
              { step: '03', icon: '⬇️', title: 'Instant download', desc: '300 DPI PNG with transparent background. Ready to print.' },
              { step: '04', icon: '💰', title: 'Start selling', desc: 'Upload to Printify or Printful. List your products. Make money.' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #e94560, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22, boxShadow: '0 4px 20px rgba(233,69,96,0.3)' }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#e94560', letterSpacing: '0.1em', marginBottom: 6 }}>STEP {item.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFINITE REVIEWS */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Loved by POD Sellers</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
              {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#f59e0b', fontSize: 20 }}>{s}</span>)}
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Trusted by thousands of Printify & Printful sellers</p>
          </div>
          <InfiniteReviews />
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ background: 'linear-gradient(135deg, #e94560, #f97316)', padding: '72px 24px', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: 'white', marginBottom: 16, letterSpacing: '-0.02em' }}>
            Ready to grow your POD store?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
            Join thousands of sellers who use Tiklife designs to create bestselling products.
          </p>
          <Link href="/shop" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 58, padding: '0 40px', borderRadius: 14,
            background: 'white', color: '#e94560',
            fontWeight: 800, fontSize: 18, textDecoration: 'none',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}>
            Start Browsing — From $2.99 →
          </Link>
        </div>
      </section>
    </div>
  )
}
