import { NextRequest, NextResponse } from 'next/server'
import { createR2UploadUrl } from '@/lib/r2'

const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'svg', 'zip']

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  zip: 'application/zip',
}

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { type, slug, filename } = await request.json()

    if (!type || !slug || !filename) {
      return NextResponse.json({ error: 'Missing type, slug, or filename' }, { status: 400 })
    }

    const ext = filename.split('.').pop()?.toLowerCase() || ''

    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: `Loại file không được phép. Chỉ chấp nhận: ${ALLOWED_EXTS.join(', ')}` },
        { status: 400 }
      )
    }

    let key: string

    if (type === 'design') {
      key = `designs/${slug}.${ext}`
    } else if (type === 'preview') {
      key = `previews/${slug}-preview.jpg`
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'
    const signedUrl = await createR2UploadUrl(key, contentType)

    return NextResponse.json({ signedUrl, key })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
