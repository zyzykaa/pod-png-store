import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, createDownloadSignedUrl } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Thiếu download token' }, { status: 400 })
    }

    // Tìm order theo download_token
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*)
        )
      `)
      .eq('download_token', token)
      .single()

    if (oErr || !order) {
      return NextResponse.json({ error: 'Link không hợp lệ' }, { status: 404 })
    }

    // Kiểm tra đã thanh toán chưa
    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: 'Đơn hàng chưa được thanh toán' },
        { status: 403 }
      )
    }

    // Tạo Signed URL cho từng file trong order
    const signedUrls = await Promise.all(
      order.order_items.map(async (item: any) => {
        const product = item.product
        const signedUrl = await createDownloadSignedUrl(product.file_path)

        // Log download
        await supabaseAdmin.from('download_logs').insert({
          order_id: order.id,
          product_id: product.id,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })

        return {
          product_id: product.id,
          product_title: product.title,
          url: signedUrl,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      })
    )

    // Update download count
    await supabaseAdmin
      .from('orders')
      .update({
        download_count: (order.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return NextResponse.json({
      data: {
        order,
        signed_urls: signedUrls,
      },
    })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Lỗi tạo download link' }, { status: 500 })
  }
}
