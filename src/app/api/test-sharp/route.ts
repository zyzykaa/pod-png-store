import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

sharp.concurrency(1)
sharp.simd(false)

export async function GET(request: NextRequest) {
  try {
    // Test 1: Sharp basic
    const step1 = 'Sharp imported OK'
    
    // Test 2: Tạo ảnh đơn giản 10x10 pixel
    const buf = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } }
    }).jpeg().toBuffer()
    
    const step2 = `Sharp create OK: ${buf.length} bytes`
    
    // Test 3: SharedArrayBuffer
    let step3 = 'SharedArrayBuffer: '
    try {
      new SharedArrayBuffer(1)
      step3 += 'available'
    } catch {
      step3 += 'NOT available'
    }
    
    return NextResponse.json({ 
      ok: true, 
      steps: [step1, step2, step3],
      sharp_version: sharp.versions.sharp,
      concurrency: sharp.concurrency(),
    })
  } catch (err: any) {
    return NextResponse.json({ 
      ok: false, 
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5)
    })
  }
}
