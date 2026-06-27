import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
}

interface SignedUrl {
  product_id: string
  product_title: string
  url: string
  expires_at: string
}

async function getDownloadData(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/download?token=${token}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.data
}

export default async function DownloadPage({ params }: Props) {
  const { token } = await params
  const downloadData = await getDownloadData(token)

  if (!downloadData) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Link not found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          This download link is invalid or has expired.
        </p>
        <a href="/shop" className="btn btn-primary">Back to Shop</a>
      </div>
    )
  }

  const { order, signed_urls } = downloadData

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 80, maxWidth: 640 }}>
      {/* Success header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#d1fae5', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 16px',
          fontSize: 36,
        }}>
          ✅
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Payment successful!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
          Your files are ready to download. A copy has been sent to{' '}
          <strong>{order.buyer_email}</strong>
        </p>
      </div>

      {/* Download cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {signed_urls.map((item: SignedUrl) => (
          <div key={item.product_id} style={{
            border: '1px solid var(--border)', borderRadius: 16,
            padding: 20, background: 'white',
          }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{item.product_title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ⏱ Link expires at {new Date(item.expires_at).toLocaleTimeString()}
              </p>
            </div>
            <a
              href={item.url}
              download
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center' }}
            >
              ⬇️ Download PNG File
            </a>
          </div>
        ))}
      </div>

      {/* Order info */}
      <div style={{
        background: 'var(--bg-soft)', borderRadius: 12,
        padding: 20, marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Order details</h3>
        <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Order ID</span>
          <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{order.id.slice(0, 8).toUpperCase()}</span>
          <span style={{ color: 'var(--text-muted)' }}>Amount paid</span>
          <span style={{ fontWeight: 600 }}>${order.amount.toFixed(2)}</span>
          <span style={{ color: 'var(--text-muted)' }}>Email</span>
          <span>{order.buyer_email}</span>
          <span style={{ color: 'var(--text-muted)' }}>Paid at</span>
          <span>{order.paid_at ? new Date(order.paid_at).toLocaleString() : '—'}</span>
        </div>
      </div>

      {/* Notice */}
      <div style={{
        fontSize: 13, color: 'var(--text-muted)',
        padding: 16, background: '#fef9c3',
        borderRadius: 10, lineHeight: 1.6,
      }}>
        ⚠️ <strong>Download links expire in 1 hour.</strong> Save your files now.
        Need to re-download? Email us with your order ID and we'll send a new link.
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href="/shop" className="btn btn-secondary">Continue shopping →</a>
      </div>
    </div>
  )
}
