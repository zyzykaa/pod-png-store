import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'
import sharp from 'sharp'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const resized = await sharp(imageBuffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  const meta = await sharp(resized).metadata()
  const W = meta.width || 800
  const H = meta.height || 800
  const fz = Math.round(W * 0.07)
  const sm = Math.round(W * 0.034)
  const lg = Math.round(W * 0.043)

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${W/2},${H/2}) rotate(-30)">
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(0,0,0,0.18)" text-anchor="middle" dy="-${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(0,0,0,0.18)" text-anchor="middle" dy="0" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(0,0,0,0.18)" text-anchor="middle" dy="${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(255,255,255,0.32)" text-anchor="middle" dy="-${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(255,255,255,0.32)" text-anchor="middle" dy="0" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(255,255,255,0.32)" text-anchor="middle" dy="${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
    </g>
    <rect x="${W-lg*7.5}" y="${H-lg*2.2}" width="${lg*7}" height="${lg*1.8}" rx="6" fill="rgba(233,69,96,0.92)"/>
    <text font-family="Arial" font-weight="900" font-size="${lg}" fill="white" x="${W-lg*4}" y="${H-lg*0.82}" text-anchor="middle">tiklife.shop</text>
    <rect x="10" y="10" width="${sm*7}" height="${sm*1.9}" rx="4" fill="rgba(0,0,0,0.62)"/>
    <text font-family="Arial" font-weight="700" font-size="${sm}" fill="white" x="${sm*3.5+10}" y="${sm*1.35+10}" text-anchor="middle" letter-spacing="3">PREVIEW</text>
  </svg>`

  return sharp(resized)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer()
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
      // Download PNG gốc từ designs bucket
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('designs')
        .download(product.file_path)

      if (dlErr || !fileData) {
        results.push({ slug: product.slug, status: 'FAIL download: ' + (dlErr?.message || 'no data') })
        continue
      }

      // Tạo watermark bằng Sharp
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const watermarked = await addWatermark(buffer)

      // Upload lên Vercel Blob
      const blob = await put(`${product.slug}-preview.jpg`, watermarked, {
        access: 'public',
        contentType: 'image/jpeg',
      })

      // Update URL trong DB
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

// POST: rebuild 1 product theo slug
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

    if (!product) return NextResponse.json({ error: 'Product không tồn tại' }, { status: 404 })

    const { data: fileData, error: dlErr } = await supabaseAdmin.storage
      .from('designs')
      .download(product.file_path)

    if (dlErr || !fileData) {
      return NextResponse.json({ error: 'Download thất bại: ' + dlErr?.message }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const watermarked = await addWatermark(buffer)

    const blob = await put(`${product.slug}-preview.jpg`, watermarked, {
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
