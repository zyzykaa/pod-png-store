import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

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
        <Navbar />
        <main>{children}</main>
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '40px 24px',
          marginTop: 80,
          background: 'var(--bg-soft)',
        }}>
          <div className="container" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--brand)', marginBottom: 8 }}>
                tik<span style={{ color: 'var(--brand-accent)' }}>life</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                High-quality PNG designs for sublimation, DTF, and screen printing. 300 DPI · Commercial license included.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Shop</div>
              {['All Designs', 'Western & Country', 'Christmas', 'Mama', 'Sports'].map(l => (
                <div key={l} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Info</div>
              {['License Info', 'FAQ', 'Contact Us', 'Refund Policy'].map(l => (
                <div key={l} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>File details</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                ✓ 300 DPI transparent PNG<br/>
                ✓ Commercial / POD license<br/>
                ✓ Instant digital download<br/>
                ✓ Works with Printify, Printful
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Tiklife. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}
