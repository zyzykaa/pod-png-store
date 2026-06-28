import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'
import sharp from 'sharp'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

async function createProtectedPreview(buffer: Buffer): Promise<Buffer> {
  // Resize về 500px
  const resized = await sharp(buffer)
    .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  const meta = await sharp(resized).metadata()
  const W = meta.width || 500
  const H = meta.height || 500

  // Watermark nhẹ - chỉ text "tiklife.shop" chéo để bảo vệ
  const fz = Math.round(W * 0.07)
  const badge = Math.round(W * 0.05)

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${W/2},${H/2}) rotate(-30)">
      <text font-family="Arial" font-weight="700" font-size="${fz}"
        fill="rgba(255,255,255,0.25)" text-anchor="middle" dy="-${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}"
        fill="rgba(255,255,255,0.25)" text-anchor="middle" dy="0" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}"
        fill="rgba(255,255,255,0.25)" text-anchor="middle" dy="${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
    </g>
    <rect x="${W-badge*6.5}" y="${H-badge*1.8}" width="${badge*6}" height="${badge*1.5}" rx="4" fill="rgba(233,69,96,0.85)"/>
    <text font-family="Arial" font-weight="800" font-size="${badge}"
      fill="white" x="${W-badge*3.5}" y="${H-badge*0.65}" text-anchor="middle">tiklife.shop</text>
  </svg>`

  return sharp(resized)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 82 })
    .toBuffer()
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, slug, file_path')
    .eq('is_active', true)

  if (!products?.length) return NextResponse.json({ error: 'No products' }, { status: 404 })

  const results = []

  for (const product of products) {
    try {
      const cleanPath = product.file_path.replace(/^designs\//, '')
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('designs').download(cleanPath)

      if (dlErr || !fileData) {
        results.push({ slug: product.slug, status: 'FAIL download: ' + dlErr?.message })
        continue
      }

      const buffer = Buffer.from(await fileData.arrayBuffer())
      const preview = await createProtectedPreview(buffer)

      const blob = await put(`${product.slug}-preview.jpg`, preview, {
        access: 'public', contentType: 'image/jpeg',
      })

      await supabaseAdmin.from('products')
        .update({ preview_url: blob.url }).eq('slug', product.slug)

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
    const { data: product } = await supabaseAdmin
      .from('products').select('id, slug, file_path').eq('slug', slug).single()

    if (!product) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    const cleanPath = product.file_path.replace(/^designs\//, '')
    const { data: fileData, error: dlErr } = await supabaseAdmin.storage
      .from('designs').download(cleanPath)

    if (dlErr || !fileData) {
      return NextResponse.json({ error: 'Download thất bại: ' + dlErr?.message }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const preview = await createProtectedPreview(buffer)

    const blob = await put(`${product.slug}-preview.jpg`, preview, {
      access: 'public', contentType: 'image/jpeg',
    })

    await supabaseAdmin.from('products')
      .update({ preview_url: blob.url }).eq('slug', product.slug)

    return NextResponse.json({ success: true, preview_url: blob.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
