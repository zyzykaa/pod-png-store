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
    const { type, slug, filename, var_index, var_label } = await request.json()

    if (!type || !slug || !filename) {
      return NextResponse.json({ error: 'Missing type, slug, or filename' }, { status: 400 })
    }

    let bucket: string, path: string

    if (type === 'design') {
      const ext = filename.split('.').pop()?.toLowerCase() || 'zip'
      path = `${slug}.${ext}`
      bucket = 'designs'
    } else if (type === 'preview') {
      path = `${slug}-preview.jpg`
      bucket = 'previews'
    } else if (type === 'variation') {
      const ext = filename.split('.').pop()?.toLowerCase() || 'png'
      const labelSlug = (var_label || 'v').toLowerCase().replace(/\s+/g, '-')
      path = `${slug}-v${var_index}-${labelSlug}.${ext}`
      bucket = 'designs'
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUploadUrl(path, { upsert: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path, bucket })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
