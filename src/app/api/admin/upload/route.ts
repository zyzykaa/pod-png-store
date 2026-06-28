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
    const type = formData.get('type') as string // 'design' | 'preview'
    const slug = formData.get('slug') as string

    if (!file || !type || !slug) {
      return NextResponse.json({ error: 'Missing file, type or slug' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())

    if (type === 'design') {
      // Luu file goc vao Supabase designs (private)
      const designPath = `${slug}.${ext}`
      const { error } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType: file.type, upsert: true })
      if (error) throw new Error(error.message)
      return NextResponse.json({ data: { file_path: designPath } })
    }

    if (type === 'preview') {
      // Upload preview (da xu ly watermark o client) len Vercel Blob
      const blob = await put(`previews/${slug}-preview.jpg`, buffer, {
        access: 'public',
        contentType: 'image/jpeg',
      })
      return NextResponse.json({ data: { preview_url: blob.url } })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
