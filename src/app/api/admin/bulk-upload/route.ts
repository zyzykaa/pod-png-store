import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 55)
    + '-' + Math.random().toString(36).slice(2, 7)
}

// POST: 1 san pham voi nhieu URLs (dark/light variants)
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, urls, category = 'miscellaneous', price = '3.99', compare_price = '9.99' } = await request.json()

  if (!title || !urls?.length) {
    return NextResponse.json({ error: 'Can title va it nhat 1 URL' }, { status: 400 })
  }

  const slug = slugify(title)
  const uploadedFiles: string[] = []
  let previewUrl = ''

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    try {
      const res = await fetch(url)
      if (!res.ok) continue

      const contentType = res.headers.get('content-type') || 'image/png'
      const buffer = Buffer.from(await res.arrayBuffer())
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'png'

      // Upload file vao designs (private) - dark/light dung suffix
      const suffix = urls.length > 1 ? `-v${i + 1}` : ''
      const designPath = `${slug}${suffix}.${ext}`

      const { error } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType, upsert: true })

      if (!error) uploadedFiles.push(designPath)

      // File dau tien = preview
      if (i === 0 && !error) {
        const previewPath = `${slug}-preview.${ext}`
        await supabaseAdmin.storage.from('previews')
          .upload(previewPath, buffer, { contentType, upsert: true })
        const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(previewPath)
        previewUrl = data.publicUrl
      }
    } catch (e) {
      continue
    }
  }

  if (!uploadedFiles.length) {
    return NextResponse.json({ error: 'Khong download duoc file nao' }, { status: 400 })
  }

  // Luu vao DB - file_path la file dau tien, cac file con lai luu vao tags
  const { error: dbErr } = await supabaseAdmin.from('products').insert({
    slug, title,
    description: '',
    price: parseFloat(price),
    compare_price: parseFloat(compare_price),
    category, tags: [],
    file_path: uploadedFiles[0],   // file chinh de download
    preview_url: previewUrl,
    mockup_urls: [],
    file_info: {
      dpi: 300, format: 'PNG', size: '',
      includes: uploadedFiles.map((f, i) => i === 0 ? 'PNG (main)' : `PNG variant ${i + 1}`),
    },
    is_active: true,
    is_featured: false,
    download_count: 0,
  })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ success: true, slug, files: uploadedFiles.length })
}
