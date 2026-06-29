export const metadata = { title: 'FAQ | Tiklife' }
const FAQS = [
  { q: 'What file format will I receive?', a: 'You will receive high-resolution PNG files with transparent backgrounds, 300 DPI. Perfect for print-on-demand, DTF printing, and sublimation.' },
  { q: 'Can I sell products made with these designs?', a: 'Yes! All designs come with a full commercial license. You can sell unlimited physical products on any platform including Etsy, Amazon, Shopify, and print-on-demand platforms.' },
  { q: 'How do I download my files after purchase?', a: 'After payment is confirmed, you will receive an email with a download link. The link is valid for 1 hour. If you need it resent, contact us at hello@tiklife.shop.' },
  { q: 'Do the designs work with Printify and Printful?', a: 'Absolutely! Our designs are optimized for Printify, Printful, Gooten, and all major POD platforms. Simply download and upload directly to your product listings.' },
  { q: 'Can I use these designs for DTF printing?', a: 'Yes! 300 DPI PNG files are perfect for DTF (Direct to Film) printing. The transparent background works seamlessly for transfers.' },
  { q: 'What if I am not satisfied with my purchase?', a: 'Due to the digital nature of our products, we do not offer refunds after download. However, if there is a technical issue with your file, contact us within 48 hours and we will make it right.' },
  { q: 'Can I modify the designs?', a: 'Yes, you can modify colors, resize, and adjust elements for your products. You cannot resell the original or modified PNG files as standalone digital products.' },
  { q: 'How many products can I make with one design?', a: 'Unlimited! There is no limit to how many products you can create and sell with each design.' },
  { q: 'Do you offer bulk discounts?', a: 'We are working on bundle deals! Subscribe to our email list to be notified when bundle pricing launches.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major payment methods through PayPal — including credit cards, debit cards, and PayPal balance. No PayPal account required.' },
]
export default function FAQPage() {
  return (
    <div className="container" style={{ maxWidth: 720, padding: '64px 24px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Frequently Asked Questions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 48 }}>Everything you need to know about Tiklife designs.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQS.map((faq, i) => (
          <details key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
            <summary style={{ padding: '18px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {faq.q} <span style={{ fontSize: 20, color: '#aaa', flexShrink: 0 }}>+</span>
            </summary>
            <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{faq.a}</div>
          </details>
        ))}
      </div>
      <div style={{ marginTop: 48, background: 'linear-gradient(135deg, #e94560, #f97316)', borderRadius: 16, padding: 28, textAlign: 'center', color: 'white' }}>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Still have questions?</h3>
        <p style={{ opacity: 0.85, marginBottom: 16 }}>We are here to help!</p>
        <a href="/contact" style={{ display: 'inline-block', background: 'white', color: '#e94560', padding: '10px 24px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Contact Us</a>
      </div>
    </div>
  )
}
