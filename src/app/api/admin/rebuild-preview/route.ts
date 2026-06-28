import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

// GET: rebuild tất cả products
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
      // Download PNG gốc - bỏ prefix "designs/" vì bucket đã là "designs"
      const cleanPath = product.file_path.replace('designs/', '')
      
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('designs')
        .download(cleanPath)

      if (dlErr || !fileData) {
        results.push({ slug: product.slug, status: 'FAIL: ' + (dlErr?.message || 'no data') })
        continue
      }

      // Upload thẳng PNG gốc lên Vercel Blob - không dùng Sharp
      const arrayBuffer = await fileData.arrayBuffer()
      const blob = await put(`${product.slug}-preview.png`, arrayBuffer, {
        access: 'public',
        contentType: 'image/png',
      })

      // Update DB
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

// POST: rebuild 1 product
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

    if (!product) return NextResponse.json({ error: 'Không tìm thấy product' }, { status: 404 })

    const cleanPath = product.file_path.replace('designs/', '')
    const { data: fileData, error: dlErr } = await supabaseAdmin.storage
      .from('designs')
      .download(cleanPath)

    if (dlErr || !fileData) {
      return NextResponse.json({ error: 'Download thất bại: ' + dlErr?.message }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const blob = await put(`${product.slug}-preview.png`, arrayBuffer, {
      access: 'public',
      contentType: 'image/png',
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
