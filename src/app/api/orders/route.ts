import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createPayPalOrder } from '@/lib/paypal'
import { CreateOrderPayload } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload = await request.json()
    const { items, buyer_email, buyer_name } = body

    if (!items?.length || !buyer_email) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đơn hàng' },
        { status: 400 }
      )
    }

    // Lấy products từ DB để verify giá (không tin giá từ client)
    const productIds = items.map(i => i.product_id)
    const { data: products, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, price, title, is_active')
      .in('id', productIds)
      .eq('is_active', true)

    if (pErr || !products?.length) {
      return NextResponse.json({ error: 'Product không hợp lệ' }, { status: 400 })
    }

    // Tính tổng tiền từ DB (không từ client)
    const amount = products.reduce((sum, p) => sum + Number(p.price), 0)

    // Tạo order trong DB với status 'pending'
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_email,
        buyer_name: buyer_name || null,
        amount,
        status: 'pending',
      })
      .select()
      .single()

    if (oErr || !order) {
      return NextResponse.json({ error: 'Không thể tạo order' }, { status: 500 })
    }

    // Tạo order items
    const orderItems = products.map(p => ({
      order_id: order.id,
      product_id: p.id,
      price: Number(p.price),
    }))

    await supabaseAdmin.from('order_items').insert(orderItems)

    // Tạo PayPal order
    const paypalOrder = await createPayPalOrder(amount, order.id)

    // Lưu PayPal order ID vào DB
    await supabaseAdmin
      .from('orders')
      .update({ paypal_order_id: paypalOrder.id })
      .eq('id', order.id)

    return NextResponse.json({
      data: {
        order_id: order.id,
        paypal_order_id: paypalOrder.id,
        amount,
      },
    })
  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { error: 'Lỗi tạo đơn hàng' },
      { status: 500 }
    )
  }
}
