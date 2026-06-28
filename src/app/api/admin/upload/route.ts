import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'
import sharp from 'sharp'

sharp.concurrency(1)

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

async function createPreview(buffer: Buffer): Promise<Buffer> {
  const resized = await sharp(buffer)
    .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  const meta = await sharp(resized).metadata()
  const W = meta.width || 500
  const H = meta.height || 500
  const fz = Math.round(W * 0.07)
  const badge = Math.round(W * 0.05)

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${W/2},${H/2}) rotate(-30)">
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(255,255,255,0.3)"
        text-anchor="middle" dy="-${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(255,255,255,0.3)"
        text-anchor="middle" dy="0" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(255,255,255,0.3)"
        text-anchor="middle" dy="${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
    </g>
    <rect x="${W-badge*6.5}" y="${H-badge*1.8}" width="${badge*6}" height="${badge*1.5}"
      rx="4" fill="rgba(233,69,96,0.88)"/>
    <text font-family="Arial" font-weight="800" font-size="${badge}" fill="white"
      x="${W-badge*3.5}" y="${H-badge*0.65}" text-anchor="middle">tiklife.shop</text>
  </svg>`

  return sharp(resized)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer()
}

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

    if (type === 'design') {
      // Upload file gốc vào Supabase designs (private)
      const designPath = `${slug}.${ext}`
      const { error: dErr } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType: file.type, upsert: true })
      if (dErr) throw new Error('Upload design thất bại: ' + dErr.message)

      // Tạo preview 500px + watermark → Vercel Blob
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')
      let previewUrl = ''

      if (isImage) {
        const preview = await createPreview(buffer)
        const blob = await put(`previews/${slug}-preview.jpg`, preview, {
          access: 'public',
          contentType: 'image/jpeg',
        })
        previewUrl = blob.url
      }

      return NextResponse.json({
        data: { file_path: designPath, preview_url: previewUrl, auto_preview: isImage }
      })
    }

    return NextResponse.json({ error: 'Type không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload thất bại' }, { status: 500 })
  }
}
