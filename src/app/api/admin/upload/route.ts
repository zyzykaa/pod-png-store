import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { put } from '@vercel/blob'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
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
    const arrayBuffer = await file.arrayBuffer()

    if (type === 'design') {
      // 1. Lưu file gốc vào Supabase designs (private)
      const designPath = `${slug}.${ext}`
      const { error: dErr } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, arrayBuffer, { contentType: file.type, upsert: true })
      if (dErr) throw new Error('Upload design thất bại: ' + dErr.message)

      // 2. Upload thẳng lên Vercel Blob làm preview (không Sharp, không watermark)
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')
      let previewUrl = ''

      if (isImage) {
        const blob = await put(`${slug}-preview.${ext}`, arrayBuffer, {
          access: 'public',
          contentType: file.type,
        })
        previewUrl = blob.url
      }

      return NextResponse.json({
        data: {
          file_path: designPath,
          preview_url: previewUrl,
          auto_preview: isImage,
        }
      })
    }

    return NextResponse.json({ error: 'Type không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload thất bại' }, { status: 500 })
  }
}
