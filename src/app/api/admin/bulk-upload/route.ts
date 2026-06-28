import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'

sharp.concurrency(1)
sharp.simd(false)

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 55)
    + '-' + Math.random().toString(36).slice(2, 7)
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

  const svg = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${W/2},${H/2}) rotate(-30)">
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(255,255,255,0.28)"
        text-anchor="middle" dy="-${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(255,255,255,0.28)"
        text-anchor="middle" dy="0" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(255,255,255,0.28)"
        text-anchor="middle" dy="${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(0,0,0,0.12)"
        text-anchor="middle" dy="-${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(0,0,0,0.12)"
        text-anchor="middle" dy="0" letter-spacing="3">TIKLIFE.SHOP</text>
      <text font-family="Arial" font-weight="700" font-size="${fz}" fill="rgba(0,0,0,0.12)"
        text-anchor="middle" dy="${fz*1.2}" letter-spacing="3">TIKLIFE.SHOP</text>
    </g>
    <rect x="${W-badge*6.5}" y="${H-badge*1.8}" width="${badge*6}" height="${badge*1.5}"
      rx="4" fill="rgba(233,69,96,0.88)"/>
    <text font-family="Arial" font-weight="800" font-size="${badge}" fill="white"
      x="${W-badge*3.5}" y="${H-badge*0.65}" text-anchor="middle">tiklife.shop</text>
  </svg>`)

  return sharp(resized)
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer()
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, urls, category = 'miscellaneous', price = '3.99', compare_price = '9.99' } = await request.json()
  if (!title || !urls?.length) {
    return NextResponse.json({ error: 'Can title va it nhat 1 URL' }, { status: 400 })
  }

  const slug = slugify(title)
  const uploadedFiles: string[] = []
  let previewUrl = ''

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    try {
      const res = await fetch(url)
      if (!res.ok) continue

      const contentType = res.headers.get('content-type') || 'image/png'
      const buffer = Buffer.from(await res.arrayBuffer())
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'png'
      const suffix = urls.length > 1 ? `-v${i + 1}` : ''
      const designPath = `${slug}${suffix}.${ext}`

      // Upload file GOC vao designs (private)
      const { error } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType, upsert: true })
      if (!error) uploadedFiles.push(designPath)

      // File dau tien → tao preview co WATERMARK
      if (i === 0 && !error) {
        const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
        if (isImage) {
          const watermarked = await createPreview(buffer)
          const previewPath = `${slug}-preview.jpg`
          await supabaseAdmin.storage.from('previews')
            .upload(previewPath, watermarked, { contentType: 'image/jpeg', upsert: true })
          const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(previewPath)
          previewUrl = data.publicUrl
        }
      }
    } catch (e) {
      continue
    }
  }

  if (!uploadedFiles.length) {
    return NextResponse.json({ error: 'Khong download duoc file nao' }, { status: 400 })
  }

  const { error: dbErr } = await supabaseAdmin.from('products').insert({
    slug, title, description: '',
    price: parseFloat(price),
    compare_price: parseFloat(compare_price),
    category, tags: [],
    file_path: uploadedFiles[0],
    preview_url: previewUrl,
    mockup_urls: [],
    file_info: {
      dpi: 300, format: 'PNG', size: '',
      includes: uploadedFiles.map((_, i) => i === 0 ? 'PNG (main)' : `PNG variant ${i + 1}`),
    },
    is_active: true, is_featured: false, download_count: 0,
  })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ success: true, slug, files: uploadedFiles.length, preview_url: previewUrl })
}
