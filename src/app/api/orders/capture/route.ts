import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { capturePayPalOrder, getPayPalOrder } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    const { paypal_order_id } = await request.json()

    if (!paypal_order_id) {
      return NextResponse.json({ error: 'Thiếu paypal_order_id' }, { status: 400 })
    }

    // Tìm order trong DB theo paypal_order_id
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('paypal_order_id', paypal_order_id)
      .single()

    if (oErr || !order) {
      return NextResponse.json({ error: 'Không tìm thấy order' }, { status: 404 })
    }

    // Nếu đã paid rồi thì không capture lại
    if (order.status === 'paid') {
      return NextResponse.json({
        data: { download_token: order.download_token },
      })
    }

    // Capture tiền từ PayPal
    const captureResult = await capturePayPalOrder(paypal_order_id)

    // Kiểm tra kết quả capture
    const captureStatus = captureResult.status
    const captureId = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id

    if (captureStatus !== 'COMPLETED') {
      // Đánh dấu failed
      await supabaseAdmin
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', order.id)

      return NextResponse.json(
        { error: 'PayPal capture không thành công' },
        { status: 400 }
      )
    }

    // Update order thành paid
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        paypal_capture_id: captureId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select()
      .single()

    // Lấy PayPal payer info để update buyer name nếu chưa có
    if (!order.buyer_name && captureResult.payer) {
      const payer = captureResult.payer
      const fullName = [payer.name?.given_name, payer.name?.surname]
        .filter(Boolean)
        .join(' ')

      if (fullName) {
        await supabaseAdmin
          .from('orders')
          .update({ buyer_name: fullName })
          .eq('id', order.id)
      }
    }

    return NextResponse.json({
      data: {
        download_token: updatedOrder?.download_token || order.download_token,
        order_id: order.id,
      },
    })
  } catch (err) {
    console.error('Capture error:', err)
    return NextResponse.json({ error: 'Lỗi capture payment' }, { status: 500 })
  }
}
