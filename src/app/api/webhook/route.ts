import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPayPalWebhook } from '@/lib/paypal'

// Phải đọc raw body để verify signature
export const config = { api: { bodyParser: false } }

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers: Record<string, string> = {}

    // Thu thập PayPal headers để verify
    for (const [key, val] of request.headers.entries()) {
      if (key.startsWith('paypal-')) {
        headers[key] = val
      }
    }

    // Verify webhook signature từ PayPal
    const webhookId = process.env.PAYPAL_WEBHOOK_ID!
    const isValid = await verifyPayPalWebhook(headers, body, webhookId)

    if (!isValid) {
      console.error('PayPal webhook signature không hợp lệ')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const eventType = event.event_type

    // Chỉ xử lý event PAYMENT.CAPTURE.COMPLETED
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = event.resource?.id
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id

      if (!orderId) {
        return NextResponse.json({ received: true })
      }

      // Tìm order trong DB theo PayPal order ID
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('paypal_order_id', orderId)
        .single()

      if (order && order.status !== 'paid') {
        // Update status thành paid (backup nếu capture API chưa kịp update)
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            paypal_capture_id: captureId,
            paid_at: new Date().toISOString(),
          })
          .eq('id', order.id)
      }
    }

    // Xử lý refund
    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id

      if (orderId) {
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('paypal_order_id', orderId)
          .single()

        if (order) {
          await supabaseAdmin
            .from('orders')
            .update({ status: 'refunded' })
            .eq('id', order.id)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
