export const metadata = { title: 'Refund Policy | Tiklife' }
export default function RefundPage() {
  return (
    <div className="container" style={{ maxWidth: 720, padding: '64px 24px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Refund Policy</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>Last updated: June 2026</p>
      {[
        { title: 'Digital Products Policy', content: 'Due to the nature of digital products, all sales are final once the file has been downloaded. We cannot offer refunds on digital downloads as the product cannot be returned.' },
        { title: 'When We Will Offer a Refund', content: 'We will provide a full refund or replacement in the following cases:', bullets: ['The file is corrupted or cannot be opened', 'You received the wrong file', 'The file does not match the product description', 'A technical error prevented you from downloading'] },
        { title: 'How to Request a Refund', content: 'Contact us at hello@tiklife.shop within 48 hours of purchase with your order ID and a description of the issue. We will respond within 24 hours.' },
        { title: 'Duplicate Purchases', content: 'If you accidentally purchased the same design twice, contact us and we will refund the duplicate charge.' },
        { title: 'Chargebacks', content: 'Please contact us before initiating a chargeback. We are always happy to resolve issues directly and quickly. Chargebacks filed without contacting us first may result in account suspension.' },
      ].map((section, i) => (
        <div key={i} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{section.title}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8 }}>{section.content}</p>
          {section.bullets && (
            <ul style={{ marginTop: 12, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {section.bullets.map((b, j) => (
                <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-muted)' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <div style={{ background: '#f8f8fa', borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Need help?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Email us at <a href="mailto:hello@tiklife.shop" style={{ color: 'var(--brand-accent)' }}>hello@tiklife.shop</a> — we respond within 24 hours.</p>
      </div>
    </div>
  )
}
