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
