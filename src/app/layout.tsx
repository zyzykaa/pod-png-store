import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import { Analytics } from '@vercel/analytics/next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://tiklife.shop'),
  title: {
    default: 'Tiklife — Premium PNG Designs for Sublimation & DTF',
    template: '%s | Tiklife',
  },
  description: 'Download high-quality PNG designs for sublimation, DTF, and screen printing. 300 DPI transparent backgrounds. Commercial license included. Instant digital download.',
  keywords: ['PNG designs', 'sublimation designs', 'DTF designs', 'POD designs', 'commercial use PNG', 'tiklife'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tiklife.shop',
    siteName: 'Tiklife',
    title: 'Tiklife — Premium PNG Designs for Sublimation & DTF',
    description: 'High-quality PNG designs for sublimation, DTF & screen printing. 300 DPI · Commercial license · Instant download.',
    images: [{
      url: 'https://tiklife.shop/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Tiklife PNG Designs',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tiklife — Premium PNG Designs for Sublimation & DTF',
    description: 'High-quality PNG designs for sublimation, DTF & screen printing.',
    images: ['https://tiklife.shop/og-image.jpg'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        <Navbar />
        <main>{children}</main>
        <footer style={{ borderTop: '1px solid var(--border)', paddingTop: 56, paddingBottom: 32, marginTop: 80, background: '#0f0c29', color: 'white' }}>
          <div className="container">
            <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
              {/* Brand */}
              <div>
                <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 12 }}>
                  tik<span style={{ color: '#e94560' }}>life</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 20, maxWidth: 260 }}>
                  Premium PNG designs for print-on-demand sellers. 300 DPI · Commercial license · Instant download.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Printify', 'Printful', 'DTF'].map(b => (
                    <span key={b} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>{b}</span>
                  ))}
                </div>
              </div>

              {/* Shop */}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 16, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shop</div>
                {[
                  ['All Designs', '/shop'],
                  ['Western', '/shop?category=western'],
                  ['Christmas', '/shop?category=christmas'],
                  ['Mama Designs', '/shop?category=mama'],
                  ['Sports & Teams', '/shop?category=sports-and-teams'],
                  ['Tumbler Wraps', '/shop?category=tumbler-wraps'],
                ].map(([label, href]) => (
                  <a key={href} href={href} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
  >
                    {label}
                  </a>
                ))}
              </div>

              {/* Info */}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 16, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Info</div>
                {[
                  ['License Info', '/license'],
                  ['FAQ', '/faq'],
                  ['Contact Us', '/contact'],
                  ['Refund Policy', '/refund'],
                ].map(([label, href]) => (
                  <a key={href} href={href} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: 10 }}>{label}</a>
                ))}
              </div>

              {/* File Details */}
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 16, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>File Details</div>
                {[
                  '✓ 300 DPI PNG',
                  '✓ Transparent background',
                  '✓ Commercial license',
                  '✓ Instant download',
                  '✓ Works with Printify',
                  '✓ Works with Printful',
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{item}</div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                © {new Date().getFullYear()} Tiklife. All rights reserved.
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {[['License', '/license'], ['FAQ', '/faq'], ['Refund', '/refund'], ['Contact', '/contact']].map(([label, href]) => (
                  <a key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{label}</a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}
