import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const type = formData.get('type') as string
    const slug = formData.get('slug') as string

    if (!type || !slug) {
      return NextResponse.json({ error: 'Missing type or slug' }, { status: 400 })
    }

    // Upload preview (watermark da xu ly o client)
    if (type === 'preview') {
      const file = formData.get('file') as File
      const buffer = Buffer.from(await file.arrayBuffer())
      const previewPath = `${slug}-preview.jpg`
      const { error } = await supabaseAdmin.storage
        .from('previews')
        .upload(previewPath, buffer, { contentType: 'image/jpeg', upsert: true })
      if (error) throw new Error(error.message)
      const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(previewPath)
      return NextResponse.json({ data: { preview_url: data.publicUrl } })
    }

    // Upload design file (ZIP hoac PNG)
    if (type === 'design') {
      const file = formData.get('file') as File
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.name.split('.').pop()?.toLowerCase() || 'zip'
      const contentType = ext === 'zip' ? 'application/zip' : file.type
      const designPath = `${slug}.${ext}`
      const { error } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType, upsert: true })
      if (error) throw new Error(error.message)
      return NextResponse.json({ data: { file_path: designPath } })
    }

    // Upload variation design file
    if (type === 'variation') {
      const file = formData.get('file') as File
      const varIndex = formData.get('var_index') as string // '0', '1', '2'...
      const varLabel = formData.get('var_label') as string // 'Dark', 'Light', 'Color'

      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      // Path: slug-v0-dark.png, slug-v1-light.png
      const labelSlug = varLabel.toLowerCase().replace(/\s+/g, '-')
      const designPath = `${slug}-v${varIndex}-${labelSlug}.${ext}`

      const { error } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType: file.type, upsert: true })
      if (error) throw new Error(error.message)

      return NextResponse.json({ data: { file_path: designPath, var_index: varIndex, var_label: varLabel } })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
