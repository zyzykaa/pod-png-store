import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Dùng request.nextUrl thay vì new URL() để tránh parse lỗi
  const imageUrl = request.nextUrl.searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing url', { status: 400 })
  }

  // Chỉ cho phép Supabase domain
  if (!imageUrl.includes('supabase.co')) {
    return new NextResponse('Invalid domain', { status: 400 })
  }

  try {
    const res = await fetch(imageUrl)

    if (!res.ok) {
      return new NextResponse(`Upstream ${res.status}`, { status: res.status })
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err: any) {
    return new NextResponse('Fetch error: ' + err.message, { status: 500 })
  }
}
