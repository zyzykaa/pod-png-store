import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {}
  
  // Check environment
  results.node_version = process.version
  results.platform = process.platform
  results.arch = process.arch
  
  try {
    results.shared_array_buffer = typeof SharedArrayBuffer !== 'undefined' ? 'available' : 'undefined'
  } catch(e: any) {
    results.shared_array_buffer = 'error: ' + e.message
  }
  
  // Test sharp import
  try {
    const sharp = require('sharp')
    sharp.concurrency(1)
    sharp.simd(false)
    results.sharp_import = 'OK'
    results.sharp_version = sharp.versions?.sharp
    results.concurrency = sharp.concurrency()
    
    // Test basic operation
    const buf = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } }
    }).jpeg().toBuffer()
    results.sharp_create = `OK (${buf.length} bytes)`
    
  } catch(e: any) {
    results.sharp_error = e.message
    results.sharp_stack = e.stack?.split('\n').slice(0, 8)
  }
  
  return NextResponse.json(results, { status: 200 })
}

// POST endpoint test Sharp resize thật - không cần auth
export async function POST(request: NextRequest) {
  try {
    const sharp = (await import('sharp')).default
    sharp.concurrency(1)
    sharp.simd(false)
    sharp.cache(false)

    // Tạo ảnh PNG 100x100 test
    const testPng = await sharp({
      create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } }
    }).png().toBuffer()

    // Resize
    const resized = await sharp(testPng)
      .resize({ width: 50, height: 50 })
      .jpeg({ quality: 85 })
      .toBuffer()

    // SVG composite
    const svg = Buffer.from('<svg width="50" height="50"><text x="5" y="25" fill="white" font-size="10">TEST</text></svg>')
    const final = await sharp(resized)
      .composite([{ input: svg, top: 0, left: 0 }])
      .jpeg({ quality: 85 })
      .toBuffer()

    return NextResponse.json({
      ok: true,
      node: process.version,
      sab: typeof SharedArrayBuffer !== 'undefined',
      resize_size: resized.length,
      composite_size: final.length,
      message: 'Sharp hoạt động hoàn toàn!'
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      node: process.version,
      sab: typeof SharedArrayBuffer !== 'undefined',
      error: err.message,
    })
  }
}
