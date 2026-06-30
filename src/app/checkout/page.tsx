'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

export default function CheckoutPage() {
  const { items, total, removeItem, clearCart } = useCart()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [step, setStep] = useState<'email' | 'paypal' | 'processing'>('email')
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  function validateEmail() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  async function createOrder() {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ product_id: i.product.id, price: i.product.price })),
        buyer_email: email,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to create order')
    return data.data.paypal_order_id
  }

  async function onApprove(data: { orderID: string }) {
    setStep('processing')
    try {
      const res = await fetch('/api/orders/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paypal_order_id: data.orderID }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      clearCart()
      router.push(`/download/${result.data.download_token}`)
    } catch (err) {
      alert('Payment error. Please contact support.')
      setStep('paypal')
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Your cart is empty</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Browse our designs and add some to your cart.</p>
        <Link href="/shop" style={{
          display: 'inline-flex', height: 48, padding: '0 28px', borderRadius: 12,
          background: '#e94560', color: 'white', textDecoration: 'none',
          fontWeight: 700, alignItems: 'center',
        }}>Browse Designs →</Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 640, padding: '40px 24px 100px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Checkout</h1>

      {/* Cart items */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: 16, marginBottom: 20 }}>
        {items.map(item => (
          <div key={item.product.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: '1px solid #f5f5f5',
          }}>
            <img src={item.product.preview_url} alt={item.product.title}
              style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, background: '#f8f8fa', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.product.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.product.category}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>${item.product.price.toFixed(2)}</span>
            <button onClick={() => removeItem(item.product.id)}
              style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, fontWeight: 800, fontSize: 18 }}>
          <span>Total</span>
          <span style={{ color: '#e94560' }}>${total().toFixed(2)}</span>
        </div>
      </div>

      {/* Email + PayPal */}
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!, currency: 'USD' }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', padding: 20 }}>
          {step === 'email' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Your email — download links will be sent here
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', height: 46, padding: '0 14px',
                  border: `1.5px solid ${emailError ? '#ef4444' : '#e5e5e5'}`,
                  borderRadius: 10, fontSize: 14, marginBottom: 4, outline: 'none', boxSizing: 'border-box',
                }} />
              {emailError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{emailError}</p>}
              <button
                onClick={() => { if (validateEmail()) setStep('paypal') }}
                style={{
                  width: '100%', height: 48, marginTop: 10, borderRadius: 10, border: 'none',
                  background: '#e94560', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}>
                Continue to Payment →
              </button>
            </div>
          )}

          {step === 'paypal' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sending to: {email}</span>
                <button onClick={() => setStep('email')} style={{ fontSize: 12, color: '#e94560', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
              </div>
              <PayPalButtons
                style={{ layout: 'vertical', shape: 'rect', color: 'blue' }}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={() => alert('PayPal error. Please try again.')}
              />
            </div>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p style={{ fontWeight: 600 }}>Processing your payment...</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Please don't close this tab</p>
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            🔒 Secure payment via PayPal · No account required
          </div>
        </div>
      </PayPalScriptProvider>
    </div>
  )
}
