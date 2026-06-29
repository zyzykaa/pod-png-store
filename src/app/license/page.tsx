export const metadata = { title: 'License Info | Tiklife' }
export default function LicensePage() {
  return (
    <div className="container" style={{ maxWidth: 720, padding: '64px 24px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>License Information</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>Last updated: June 2026</p>
      {[
        { title: '✅ What you CAN do', items: ['Sell unlimited physical products (t-shirts, mugs, tumblers, hoodies, etc.)', 'Use on print-on-demand platforms (Printify, Printful, Gooten, etc.)', 'Use for DTF transfers and sublimation printing', 'Sell on marketplaces (Etsy, Amazon, eBay, Shopify, etc.)', 'Use in your local print shop for customer orders', 'Modify colors and elements for your products', 'Use for personal and commercial projects'] },
        { title: '❌ What you CANNOT do', items: ['Resell, redistribute, or share the original PNG files', 'Include the PNG files in bundles or design packs for resale', 'Claim the designs as your own original artwork', 'Use for NFTs or digital collectibles', 'Sub-license the files to third parties'] },
      ].map((section, i) => (
        <div key={i} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>{section.title}</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {section.items.map((item, j) => (
              <li key={j} style={{ padding: '12px 16px', background: i === 0 ? '#f0fdf4' : '#fff5f5', borderRadius: 10, fontSize: 14, color: i === 0 ? '#166534' : '#991b1b', display: 'flex', gap: 10 }}>
                <span>{i === 0 ? '✓' : '✗'}</span> {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div style={{ background: '#f8f8fa', borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Questions about licensing?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Contact us at <a href="mailto:hello@tiklife.shop" style={{ color: 'var(--brand-accent)' }}>hello@tiklife.shop</a></p>
      </div>
    </div>
  )
}
