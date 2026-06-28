import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

async function resizeImage(buffer: ArrayBuffer, mimeType: string): Promise<ArrayBuffer> {
  try {
    const blob = new Blob([buffer], { type: mimeType })
    const bitmap = await createImageBitmap(blob)
    
    const MAX = 500
    let w = bitmap.width
    let h = bitmap.height
    if (w > h) { h = Math.round(h * MAX / w); w = MAX }
    else { w = Math.round(w * MAX / h); h = MAX }
    
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    
    const resizedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
    return resizedBlob.arrayBuffer()
  } catch {
    return buffer // fallback: trả file gốc nếu không resize được
  }
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, slug, file_path')
    .eq('is_active', true)

  if (!products?.length) {
    return NextResponse.json({ error: 'No products' }, { status: 404 })
  }

  const results = []

  for (const product of products) {
    try {
      const cleanPath = product.file_path.replace(/^designs\//, '')
      
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('designs')
        .download(cleanPath)

      if (dlErr || !fileData) {
        results.push({ slug: product.slug, status: 'FAIL: ' + (dlErr?.message || 'no data') })
        continue
      }

      const arrayBuffer = await fileData.arrayBuffer()
      // Resize 500px
      const resized = await resizeImage(arrayBuffer, 'image/png')

      const blob = await put(`${product.slug}-preview.jpg`, resized, {
        access: 'public',
        contentType: 'image/jpeg',
      })

      await supabaseAdmin
        .from('products')
        .update({ preview_url: blob.url })
        .eq('slug', product.slug)

      results.push({ slug: product.slug, status: 'OK', url: blob.url })
    } catch (err: any) {
      results.push({ slug: product.slug, status: 'ERROR: ' + err.message })
    }
  }

  return NextResponse.json({ results })
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug } = await request.json()
    if (!slug) return NextResponse.json({ error: 'Thiếu slug' }, { status: 400 })

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, slug, file_path')
      .eq('slug', slug)
      .single()

    if (!product) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    const cleanPath = product.file_path.replace(/^designs\//, '')
    const { data: fileData, error: dlErr } = await supabaseAdmin.storage
      .from('designs')
      .download(cleanPath)

    if (dlErr || !fileData) {
      return NextResponse.json({ error: 'Download thất bại: ' + dlErr?.message }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const resized = await resizeImage(arrayBuffer, 'image/png')

    const blob = await put(`${product.slug}-preview.jpg`, resized, {
      access: 'public',
      contentType: 'image/jpeg',
    })

    await supabaseAdmin
      .from('products')
      .update({ preview_url: blob.url })
      .eq('slug', product.slug)

    return NextResponse.json({ success: true, preview_url: blob.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
