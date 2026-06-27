import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Kiểm tra admin password đơn giản
function checkAuth(request: NextRequest) {
  const adminPass = request.headers.get('x-admin-key')
  return adminPass === process.env.ADMIN_SECRET_KEY
}

// Upload design file (ZIP/PNG gốc) vào private bucket
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

    let bucket = ''
    let filePath = ''
    let publicUrl = ''

    if (type === 'design') {
      // File gốc → private bucket
      bucket = 'designs'
      filePath = `designs/${slug}.${ext}`
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, buffer, { contentType: file.type, upsert: true })
      if (error) throw error
      return NextResponse.json({ data: { file_path: filePath } })

    } else if (type === 'preview' || type === 'mockup') {
      // Ảnh preview/mockup → public bucket
      bucket = 'previews'
      filePath = type === 'preview'
        ? `previews/${slug}-preview.${ext}`
        : `previews/${slug}-mockup-${Date.now()}.${ext}`

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, buffer, { contentType: file.type, upsert: true })
      if (error) throw error

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath)
      publicUrl = data.publicUrl
      return NextResponse.json({ data: { url: publicUrl, file_path: filePath } })
    }

    return NextResponse.json({ error: 'Type không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload thất bại' }, { status: 500 })
  }
}
