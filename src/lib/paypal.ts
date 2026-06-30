// PayPal Orders API v2

const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

// Lấy access token từ PayPal
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error('Không thể lấy PayPal access token')
  const data = await res.json()
  return data.access_token
}

// Tạo PayPal order
export async function createPayPalOrder(amount: number, orderId: string) {
  const accessToken = await getPayPalAccessToken()

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,         // ID đơn hàng trong DB của mình
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2),
        },
        description: 'PNG Design Digital Download',
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'Tiklife',
            locale: 'en-US',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
          }
        }
      }
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`PayPal createOrder lỗi: ${JSON.stringify(err)}`)
  }

  return res.json()
}

// Capture PayPal order (trừ tiền thực sự)
export async function capturePayPalOrder(paypalOrderId: string) {
  const accessToken = await getPayPalAccessToken()

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`PayPal captureOrder lỗi: ${JSON.stringify(err)}`)
  }

  return res.json()
}

// Verify PayPal Webhook signature
export async function verifyPayPalWebhook(
  headers: Record<string, string>,
  body: string,
  webhookId: string
): Promise<boolean> {
  const accessToken = await getPayPalAccessToken()

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    }
  )

  if (!res.ok) return false
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}

// Lấy thông tin PayPal order (để double-check)
export async function getPayPalOrder(paypalOrderId: string) {
  const accessToken = await getPayPalAccessToken()

  const res = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok) throw new Error('Không thể lấy PayPal order')
  return res.json()
}
