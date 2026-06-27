import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return new NextResponse('Missing url', { status: 400 })
    }

    // Decode nếu bị double-encode
    const decodedUrl = decodeURIComponent(url)

    // Chỉ cho phép domain Supabase
    if (!decodedUrl.includes('supabase.co')) {
      return new NextResponse('Invalid domain', { status: 400 })
    }

    const res = await fetch(decodedUrl, { 
      headers: { 'User-Agent': 'Tiklife/1.0' }
    })

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: res.status })
    }

    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    console.error('Image proxy error:', err)
    return new NextResponse('Proxy error: ' + err.message, { status: 500 })
  }
}
