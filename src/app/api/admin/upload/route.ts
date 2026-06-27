import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'

// Kiểm tra admin password
function checkAuth(request: NextRequest) {
  const adminPass = request.headers.get('x-admin-key')
  return adminPass === process.env.ADMIN_SECRET_KEY
}

// ============================================================
// TẠO WATERMARK TIKLIFE
// Thêm text "tiklife.shop" chéo góc lên ảnh preview
// ============================================================
async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer)
  const meta = await image.metadata()
  const width = meta.width || 800
  const height = meta.height || 800

  // Text watermark SVG — 3 dòng chéo lớn + logo góc
  const fontSize = Math.round(width * 0.07)
  const smallFont = Math.round(width * 0.035)
  const logoFont = Math.round(width * 0.045)

  // Tạo SVG overlay với watermark
  const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .wm { font-family: Arial, sans-serif; font-weight: 900; fill: rgba(255,255,255,0.35); }
          .wm-dark { font-family: Arial, sans-serif; font-weight: 900; fill: rgba(0,0,0,0.18); }
          .logo { font-family: Arial, sans-serif; font-weight: 900; fill: rgba(255,255,255,0.85); }
          .logo-dark { font-family: Arial, sans-serif; font-weight: 900; fill: rgba(0,0,0,0.6); }
        </style>
      </defs>

      <!-- Watermark chéo giữa ảnh (3 dòng) -->
      <g transform="translate(${width / 2}, ${height / 2}) rotate(-30)">
        <text class="wm-dark" font-size="${fontSize}" text-anchor="middle" dy="-${fontSize * 1.5}"
          letter-spacing="4">TIKLIFE.SHOP</text>
        <text class="wm-dark" font-size="${fontSize}" text-anchor="middle" dy="0"
          letter-spacing="4">TIKLIFE.SHOP</text>
        <text class="wm-dark" font-size="${fontSize}" text-anchor="middle" dy="${fontSize * 1.5}"
          letter-spacing="4">TIKLIFE.SHOP</text>

        <text class="wm" font-size="${fontSize}" text-anchor="middle" dy="-${fontSize * 1.5}"
          letter-spacing="4">TIKLIFE.SHOP</text>
        <text class="wm" font-size="${fontSize}" text-anchor="middle" dy="0"
          letter-spacing="4">TIKLIFE.SHOP</text>
        <text class="wm" font-size="${fontSize}" text-anchor="middle" dy="${fontSize * 1.5}"
          letter-spacing="4">TIKLIFE.SHOP</text>
      </g>

      <!-- Logo góc dưới phải -->
      <rect x="${width - logoFont * 7.5}" y="${height - logoFont * 2.2}"
        width="${logoFont * 7}" height="${logoFont * 1.8}"
        rx="6" fill="rgba(233,69,96,0.85)" />
      <text class="logo" font-size="${logoFont}"
        x="${width - logoFont * 4}"
        y="${height - logoFont * 0.85}"
        text-anchor="middle">tiklife.shop</text>

      <!-- Dòng nhỏ PREVIEW góc trên trái -->
      <rect x="10" y="10" width="${smallFont * 6.5}" height="${smallFont * 1.8}"
        rx="4" fill="rgba(0,0,0,0.55)" />
      <text font-family="Arial" font-weight="700" font-size="${smallFont}"
        fill="white" x="${smallFont * 3.25 + 10}" y="${smallFont * 1.3 + 10}"
        text-anchor="middle" letter-spacing="2">PREVIEW</text>
    </svg>
  `

  // Resize về max 1200px để web load nhanh
  const resized = await sharp(imageBuffer)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  // Lấy lại metadata sau resize
  const resizedMeta = await sharp(resized).metadata()
  const finalWidth = resizedMeta.width || width
  const finalHeight = resizedMeta.height || height

  // Tạo lại SVG với kích thước đúng
  const finalFontSize = Math.round(finalWidth * 0.07)
  const finalSmallFont = Math.round(finalWidth * 0.035)
  const finalLogoFont = Math.round(finalWidth * 0.045)

  const finalSvg = `
    <svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${finalWidth / 2}, ${finalHeight / 2}) rotate(-30)">
        <text font-family="Arial" font-weight="900" font-size="${finalFontSize}"
          fill="rgba(0,0,0,0.2)" text-anchor="middle" dy="-${finalFontSize * 1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
        <text font-family="Arial" font-weight="900" font-size="${finalFontSize}"
          fill="rgba(0,0,0,0.2)" text-anchor="middle" dy="0" letter-spacing="4">TIKLIFE.SHOP</text>
        <text font-family="Arial" font-weight="900" font-size="${finalFontSize}"
          fill="rgba(0,0,0,0.2)" text-anchor="middle" dy="${finalFontSize * 1.5}" letter-spacing="4">TIKLIFE.SHOP</text>

        <text font-family="Arial" font-weight="900" font-size="${finalFontSize}"
          fill="rgba(255,255,255,0.35)" text-anchor="middle" dy="-${finalFontSize * 1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
        <text font-family="Arial" font-weight="900" font-size="${finalFontSize}"
          fill="rgba(255,255,255,0.35)" text-anchor="middle" dy="0" letter-spacing="4">TIKLIFE.SHOP</text>
        <text font-family="Arial" font-weight="900" font-size="${finalFontSize}"
          fill="rgba(255,255,255,0.35)" text-anchor="middle" dy="${finalFontSize * 1.5}" letter-spacing="4">TIKLIFE.SHOP</text>
      </g>

      <!-- Badge đỏ góc dưới phải -->
      <rect x="${finalWidth - finalLogoFont * 7.5}" y="${finalHeight - finalLogoFont * 2.2}"
        width="${finalLogoFont * 7}" height="${finalLogoFont * 1.8}"
        rx="6" fill="rgba(233,69,96,0.9)" />
      <text font-family="Arial" font-weight="900" font-size="${finalLogoFont}"
        fill="white" x="${finalWidth - finalLogoFont * 4}" y="${finalHeight - finalLogoFont * 0.85}"
        text-anchor="middle">tiklife.shop</text>

      <!-- PREVIEW badge góc trên trái -->
      <rect x="10" y="10" width="${finalSmallFont * 7}" height="${finalSmallFont * 1.9}"
        rx="4" fill="rgba(0,0,0,0.6)" />
      <text font-family="Arial" font-weight="700" font-size="${finalSmallFont}"
        fill="white" x="${finalSmallFont * 3.5 + 10}" y="${finalSmallFont * 1.35 + 10}"
        text-anchor="middle" letter-spacing="3">PREVIEW</text>
    </svg>
  `

  // Composite watermark lên ảnh đã resize
  const watermarked = await sharp(resized)
    .composite([{
      input: Buffer.from(finalSvg),
      top: 0,
      left: 0,
    }])
    .jpeg({ quality: 88 })
    .toBuffer()

  return watermarked
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
    const type = formData.get('type') as string // 'design' | 'preview' | 'mockup'
    const slug = formData.get('slug') as string

    if (!file || !type || !slug) {
      return NextResponse.json({ error: 'Thiếu file, type hoặc slug' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())

    // ---- DESIGN FILE (private bucket, không watermark) ----
    if (type === 'design') {
      const filePath = `designs/${slug}.${ext}`
      const { error } = await supabaseAdmin.storage
        .from('designs')
        .upload(filePath, buffer, { contentType: file.type, upsert: true })
      if (error) throw error
      return NextResponse.json({ data: { file_path: filePath } })
    }

    // ---- PREVIEW IMAGE (thêm watermark Tiklife tự động) ----
    if (type === 'preview') {
      const watermarked = await addWatermark(buffer)
      const filePath = `previews/${slug}-preview.jpg`

      const { error } = await supabaseAdmin.storage
        .from('previews')
        .upload(filePath, watermarked, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error

      const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(filePath)
      return NextResponse.json({ data: { url: data.publicUrl, file_path: filePath, watermarked: true } })
    }

    // ---- MOCKUP IMAGE (thêm badge tiklife.shop nhỏ, không watermark to) ----
    if (type === 'mockup') {
      // Mockup chỉ thêm badge nhỏ ở góc, không watermark to
      const imageInfo = await sharp(buffer).metadata()
      const w = imageInfo.width || 800
      const h = imageInfo.height || 800
      const badgeFont = Math.round(w * 0.035)

      const badgeSvg = `
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <rect x="${w - badgeFont * 7.5}" y="${h - badgeFont * 2.2}"
            width="${badgeFont * 7}" height="${badgeFont * 1.8}"
            rx="5" fill="rgba(233,69,96,0.85)" />
          <text font-family="Arial" font-weight="900" font-size="${badgeFont}"
            fill="white" x="${w - badgeFont * 4}" y="${h - badgeFont * 0.85}"
            text-anchor="middle">tiklife.shop</text>
        </svg>
      `
      const processed = await sharp(buffer)
        .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
        .composite([{ input: Buffer.from(badgeSvg), top: 0, left: 0 }])
        .jpeg({ quality: 85 })
        .toBuffer()

      const filePath = `previews/${slug}-mockup-${Date.now()}.jpg`
      const { error } = await supabaseAdmin.storage
        .from('previews')
        .upload(filePath, processed, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error

      const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(filePath)
      return NextResponse.json({ data: { url: data.publicUrl, file_path: filePath } })
    }

    return NextResponse.json({ error: 'Type không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload thất bại' }, { status: 500 })
  }
}
