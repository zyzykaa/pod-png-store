import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'

// QUAN TRỌNG: dùng Edge Runtime thay Serverless
// Edge Runtime có đầy đủ Web APIs (Canvas, ImageBitmap) không bị SharedArrayBuffer issue
export const runtime = 'edge'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Edge Runtime không có Supabase admin client tốt
  // Fetch products qua REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const productsRes = await fetch(
    `${supabaseUrl}/rest/v1/products?is_active=eq.true&select=id,slug,file_path`,
    { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
  )
  const products: any[] = await productsRes.json()

  if (!products?.length) {
    return NextResponse.json({ error: 'No products' }, { status: 404 })
  }

  const results = []

  for (const product of products) {
    try {
      const cleanPath = product.file_path.replace(/^designs\//, '')

      // Download file từ Supabase Storage qua REST
      const fileRes = await fetch(
        `${supabaseUrl}/storage/v1/object/designs/${cleanPath}`,
        { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
      )

      if (!fileRes.ok) {
        results.push({ slug: product.slug, status: `FAIL download: ${fileRes.status}` })
        continue
      }

      const arrayBuffer = await fileRes.arrayBuffer()

      // Dùng OffscreenCanvas để resize (Edge Runtime có đầy đủ Web APIs)
      let resizedBuffer = arrayBuffer
      try {
        const blob = new Blob([arrayBuffer], { type: 'image/png' })
        const bitmap = await createImageBitmap(blob)

        const MAX = 500
        let w = bitmap.width, h = bitmap.height
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }

        const canvas = new OffscreenCanvas(w, h)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0, w, h)
        bitmap.close()

        // Thêm watermark text
        ctx.save()
        ctx.translate(w / 2, h / 2)
        ctx.rotate(-Math.PI / 6)
        ctx.font = `bold ${Math.round(w * 0.07)}px Arial`
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.textAlign = 'center'
        ctx.fillText('TIKLIFE.SHOP', 0, -Math.round(w * 0.08))
        ctx.fillText('TIKLIFE.SHOP', 0, 0)
        ctx.fillText('TIKLIFE.SHOP', 0, Math.round(w * 0.08))
        ctx.restore()

        // Badge góc dưới
        const bh = Math.round(h * 0.07)
        const bw = Math.round(w * 0.4)
        ctx.fillStyle = 'rgba(233,69,96,0.85)'
        ctx.roundRect(w - bw - 8, h - bh - 8, bw, bh, 4)
        ctx.fill()
        ctx.font = `bold ${Math.round(bh * 0.65)}px Arial`
        ctx.fillStyle = 'white'
        ctx.textAlign = 'center'
        ctx.fillText('tiklife.shop', w - bw / 2 - 8, h - bh * 0.25 - 8)

        const resizedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
        resizedBuffer = await resizedBlob.arrayBuffer()
      } catch (canvasErr) {
        // Fallback: upload file gốc nếu canvas không hoạt động
        console.error('Canvas error:', canvasErr)
      }

      // Upload lên Vercel Blob
      const blobResult = await put(`previews/${product.slug}-preview.jpg`, resizedBuffer, {
        access: 'public',
        contentType: 'image/jpeg',
      })

      // Update DB qua REST
      await fetch(
        `${supabaseUrl}/rest/v1/products?slug=eq.${product.slug}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preview_url: blobResult.url }),
        }
      )

      results.push({ slug: product.slug, status: 'OK', url: blobResult.url })
    } catch (err: any) {
      results.push({ slug: product.slug, status: 'ERROR: ' + err.message })
    }
  }

  return NextResponse.json({ results })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Use GET to rebuild all' }, { status: 405 })
}
