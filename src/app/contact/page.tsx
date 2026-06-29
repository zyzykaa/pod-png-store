export const metadata = { title: 'Contact Us | Tiklife' }
export default function ContactPage() {
  return (
    <div className="container" style={{ maxWidth: 620, padding: '64px 24px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Contact Us</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 48 }}>We typically respond within 24 hours.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { icon: '📧', label: 'Email', value: 'hello@tiklife.shop', href: 'mailto:hello@tiklife.shop' },
          { icon: '🕐', label: 'Response Time', value: 'Within 24 hours (Mon–Fri)' },
          { icon: '📦', label: 'Download Issues', value: 'downloads@tiklife.shop', href: 'mailto:downloads@tiklife.shop' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px', background: 'white', borderRadius: 12, border: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 28 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
              {item.href
                ? <a href={item.href} style={{ fontSize: 16, fontWeight: 600, color: 'var(--brand-accent)', textDecoration: 'none' }}>{item.value}</a>
                : <div style={{ fontSize: 15, fontWeight: 600 }}>{item.value}</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40, padding: 24, background: '#f8f8fa', borderRadius: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Common Issues</h3>
        {[
          ['Download link expired', 'Email us with your order ID and we will resend within 1 hour.'],
          ['File not opening', 'Make sure you have software that supports PNG files (Photoshop, Canva, GIMP, etc.)'],
          ['Wrong file received', 'Contact us immediately and we will fix it right away.'],
        ].map(([issue, solution], i) => (
          <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < 2 ? '1px solid #eee' : 'none' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>🔧 {issue}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{solution}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
