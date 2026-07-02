'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PayPalButtons, PayPalScriptProvider, FUNDING } from '@paypal/react-paypal-js'
import { Product } from '@/types'
import { useCart } from '@/hooks/useCart'
import Link from 'next/link'

interface Props {
  product: Product
}

export default function ProductCheckout({ product }: Props) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'paypal' | 'processing'>('email')
  const [addedToCart, setAddedToCart] = useState(false)
  const router = useRouter()
  const { addItem, items } = useCart()

  const inCart = items.some(i => i.product.id === product.id)

  function handleAddToCart() {
    addItem(product)
    setAddedToCart(true)
  }

  const hasDiscount = product.compare_price && product.compare_price > product.price

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
        items: [{ product_id: product.id, price: product.price }],
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
      router.push(`/download/${result.data.download_token}`)
    } catch (err) {
      alert('Payment error. Please contact support.')
      setStep('paypal')
    }
  }

  return (
    <PayPalScriptProvider options={{
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
      currency: 'USD',
      'enable-funding': 'card',
    }}>
      <div style={{
        border: '2px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        background: 'white',
        position: 'sticky',
        top: 140,
      }}>
        {/* Price */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span className="price-current" style={{ fontSize: 28 }}>${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="price-original" style={{ fontSize: 16 }}>${product.compare_price!.toFixed(2)}</span>
            )}
            {hasDiscount && (
              <span className="badge badge-sale">
                {Math.round((1 - product.price / product.compare_price!) * 100)}% OFF
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            One-time purchase · Instant download
          </p>
        </div>

        {/* File info */}
        <div style={{
          background: 'var(--bg-soft)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
        }}>
          {[
            ['📐', `${product.file_info?.dpi || 300} DPI`],
            ['🎨', product.file_info?.format || 'PNG'],
            ['📏', product.file_info?.size || '4500x5400px'],
            ['✅', 'Commercial / POD license'],
            ['⚡', 'Instant digital download'],
          ].map(([icon, text]) => (
            <div key={text as string} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              fontSize: 13, padding: '4px 0',
            }}>
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === 'email' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Your email — download link will be sent here
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', height: 44, padding: '0 14px',
                border: `1.5px solid ${emailError ? '#ef4444' : 'var(--border)'}`,
                borderRadius: 10, fontSize: 14, marginBottom: 4, outline: 'none',
              }}
            />
            {emailError && (
              <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{emailError}</p>
            )}
            <button
              className="btn btn-primary"
              style={{ width: '100%', height: 48, fontSize: 15, marginTop: 8 }}
              onClick={() => { if (validateEmail()) setStep('paypal') }}
            >
              Continue to Payment →
            </button>

            {inCart || addedToCart ? (
              <Link href="/checkout"
                style={{
                  display: 'block', textAlign: 'center', width: '100%', height: 46,
                  lineHeight: '46px', borderRadius: 10, marginTop: 10,
                  background: '#16a34a', color: 'white', fontWeight: 700,
                  fontSize: 14, textDecoration: 'none',
                }}>
                ✓ In cart — Go to cart →
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                style={{
                  width: '100%', height: 46, borderRadius: 10, marginTop: 10,
                  background: 'white', border: '2px solid #e94560',
                  color: '#e94560', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                🛒 Add to Cart
              </button>
            )}
          </div>
        )}

        {/* Step 2: PayPal */}
        {step === 'paypal' && (
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 16,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sending to: {email}</span>
              <button
                onClick={() => setStep('email')}
                style={{ fontSize: 12, color: 'var(--brand-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Change
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pay with PayPal account
              </div>
              <PayPalButtons
                fundingSource={FUNDING.PAYPAL}
                style={{ layout: 'vertical', shape: 'rect', color: 'blue' }}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={() => {
                  alert('PayPal error. Please try again.')
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pay with Debit or Credit Card
              </div>
              <PayPalButtons
                fundingSource={FUNDING.CARD}
                style={{ layout: 'vertical', shape: 'rect', color: 'black', label: 'pay' }}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={() => {
                  alert('PayPal error. Please try again.')
                }}
              />
            </div>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ fontWeight: 600 }}>Processing your payment...</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Please don't close this tab</p>
          </div>
        )}

        {/* Trust */}
        <div style={{
          marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
        }}>
          🔒 Secure payment via PayPal · No account required
        </div>
      </div>
    </PayPalScriptProvider>
  )
}
