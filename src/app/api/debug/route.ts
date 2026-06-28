import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
    SUPABASE_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
    SUPABASE_SERVICE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
    BLOB_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'OK' : 'MISSING',
    ADMIN_KEY: process.env.ADMIN_SECRET_KEY ? 'OK' : 'MISSING',
    NODE: process.version,
  })
}
