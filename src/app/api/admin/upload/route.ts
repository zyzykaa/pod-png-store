import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'
import sharp from 'sharp'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

// ============================================================
// WATERMARK
// ============================================================
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
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(0,0,0,0.18)"
        text-anchor="middle" dy="-${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(0,0,0,0.18)"
        text-anchor="middle" dy="0" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(0,0,0,0.18)"
        text-anchor="middle" dy="${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(255,255,255,0.32)"
        text-anchor="middle" dy="-${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(255,255,255,0.32)"
        text-anchor="middle" dy="0" letter-spacing="4">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="900" font-size="${fz}" fill="rgba(255,255,255,0.32)"
        text-anchor="middle" dy="${fz*1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
    </g>
    <rect x="${W-lg*7.5}" y="${H-lg*2.2}" width="${lg*7}" height="${lg*1.8}" rx="6" fill="rgba(233,69,96,0.92)"/>
    <text font-family="Arial" font-weight="900" font-size="${lg}" fill="white"
      x="${W-lg*4}" y="${H-lg*0.82}" text-anchor="middle">tiklife.shop</text>
    <rect x="10" y="10" width="${sm*7}" height="${sm*1.9}" rx="4" fill="rgba(0,0,0,0.62)"/>
    <text font-family="Arial" font-weight="700" font-size="${sm}" fill="white"
      x="${sm*3.5+10}" y="${sm*1.35+10}" text-anchor="middle" letter-spacing="3">PREVIEW</text>
  </svg>`

  return sharp(resized)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 88 })
    .toBuffer()
}

// ============================================================
// API HANDLER
// ============================================================
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const slug = formData.get('slug') as string

    if (!file || !type || !slug) {
      return NextResponse.json({ error: 'Thiếu file, type hoặc slug' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())

    // ---- DESIGN FILE → upload gốc + tự tạo preview ----
    if (type === 'design') {
      // 1. Upload file gốc vào private bucket designs
      const designPath = `${slug}.${ext}`
      const { error: dErr } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType: file.type, upsert: true })
      if (dErr) throw dErr

      // 2. Nếu file là PNG/JPG → tự tạo preview có watermark
      let previewUrl = ''
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')

      if (isImage) {
        const watermarked = await addWatermark(buffer)
        const previewPath = `${slug}-preview.jpg`

        const blob = await put(previewPath, watermarked, {
          access: 'public',
          contentType: 'image/jpeg',
        })
        previewUrl = blob.url
      }

      return NextResponse.json({
        data: {
          file_path: designPath,
          preview_url: previewUrl, // trả về luôn preview URL nếu có
          auto_preview: isImage,
        }
      })
    }

    // ---- PREVIEW riêng (fallback nếu cần upload ảnh khác) ----
    if (type === 'preview') {
      const watermarked = await addWatermark(buffer)
      const previewPath = `${slug}-preview.jpg`

      const { error } = await supabaseAdmin.storage
        .from('previews')
        .upload(previewPath, watermarked, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error

      const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(previewPath)
      return NextResponse.json({ data: { url: data.publicUrl, watermarked: true } })
    }

    return NextResponse.json({ error: 'Type không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload thất bại' }, { status: 500 })
  }
}
