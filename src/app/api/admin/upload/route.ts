import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

// Resize ảnh về 500px bằng Web API thuần - không dùng Sharp
async function resizeImage(buffer: ArrayBuffer, mimeType: string): Promise<ArrayBuffer> {
  // Dùng createImageBitmap + OffscreenCanvas (có trong Node 18+ / Vercel)
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
    // Nếu không support OffscreenCanvas thì trả file gốc
    return buffer
  }
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
    const originalBuffer = await file.arrayBuffer()

    if (type === 'design') {
      // 1. Lưu file gốc vào Supabase designs (private)
      const designPath = `${slug}.${ext}`
      const { error: dErr } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, originalBuffer, { contentType: file.type, upsert: true })
      if (dErr) throw new Error('Upload design thất bại: ' + dErr.message)

      // 2. Resize 500px và upload lên Vercel Blob làm preview
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')
      let previewUrl = ''

      if (isImage) {
        const resized = await resizeImage(originalBuffer, file.type)
        const blob = await put(`${slug}-preview.jpg`, resized, {
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
