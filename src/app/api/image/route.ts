import { NextRequest, NextResponse } from 'next/server'

// Proxy ảnh từ Supabase để tránh CORS/cache issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url || !url.includes('supabase.co')) {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) return new NextResponse('Not found', { status: 404 })

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Error', { status: 500 })
  }
}
