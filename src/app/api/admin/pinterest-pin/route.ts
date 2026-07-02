import { NextRequest, NextResponse } from 'next/server'
import { createPinterestPin } from '@/lib/pinterest'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, image_url, product_url } = await request.json()

  if (!title || !image_url || !product_url) {
    return NextResponse.json({ error: 'Thiếu title, image_url hoặc product_url' }, { status: 400 })
  }

  try {
    const pin = await createPinterestPin({ title, description: description || title, imageUrl: image_url, link: product_url })
    return NextResponse.json({ id: pin.id })
  } catch (err: any) {
    if (err.message === 'not_configured') {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
