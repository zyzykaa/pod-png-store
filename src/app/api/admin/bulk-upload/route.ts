import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 55)
    + '-' + Math.random().toString(36).slice(2, 7)
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { urls, category = 'miscellaneous', price = '3.99', compare_price = '9.99' } = await request.json()
  if (!urls?.length) return NextResponse.json({ error: 'Can it nhat 1 URL' }, { status: 400 })

  const results = []

  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) { results.push({ url, status: 'FAIL', error: `HTTP ${res.status}` }); continue }

      const contentType = res.headers.get('content-type') || 'image/png'
      const buffer = Buffer.from(await res.arrayBuffer())
      const filename = new URL(url).pathname.split('/').pop() || 'design.png'
      const ext = filename.split('.').pop()?.toLowerCase() || 'png'
      const slug = slugify(filename)
      const title = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

      // Upload design (private)
      const designPath = `${slug}.${ext}`
      const { error: upErr } = await supabaseAdmin.storage
        .from('designs').upload(designPath, buffer, { contentType, upsert: true })
      if (upErr) { results.push({ url, status: 'FAIL', error: upErr.message }); continue }

      // Upload preview (public)
      const previewPath = `${slug}-preview.${ext}`
      await supabaseAdmin.storage.from('previews')
        .upload(previewPath, buffer, { contentType, upsert: true })
      const { data: urlData } = supabaseAdmin.storage.from('previews').getPublicUrl(previewPath)

      // Luu DB
      const { error: dbErr } = await supabaseAdmin.from('products').insert({
        slug, title, description: '',
        price: parseFloat(price), compare_price: parseFloat(compare_price),
        category, tags: [], file_path: designPath,
        preview_url: urlData.publicUrl, mockup_urls: [],
        file_info: { dpi: 300, format: 'PNG', size: '', includes: ['PNG transparent'] },
        is_active: true, is_featured: false, download_count: 0,
      })
      if (dbErr) { results.push({ url, status: 'FAIL', error: dbErr.message }); continue }

      results.push({ url, status: 'OK', slug, title })
    } catch (err: any) {
      results.push({ url, status: 'ERROR', error: err.message })
    }
  }

  const ok = results.filter(r => r.status === 'OK').length
  return NextResponse.json({ results, summary: `${ok}/${urls.length} thanh cong` })
}
