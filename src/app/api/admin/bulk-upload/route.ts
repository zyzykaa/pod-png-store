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

// POST mode=fetch_only: download files tu URL, luu designs, tra ve blob URL cua file dau tien cho browser
// POST mode=full (default): download + luu + tao DB (server watermark - fallback)
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, urls, category = 'miscellaneous', price = '3.99', compare_price = '9.99', mode = 'full' } = await request.json()
  if (!title || !urls?.length) {
    return NextResponse.json({ error: 'Can title va it nhat 1 URL' }, { status: 400 })
  }

  const slug = slugify(title)
  const uploadedFiles: string[] = []
  let firstFilePublicUrl = ''

  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i])
      if (!res.ok) continue

      const contentType = res.headers.get('content-type') || 'image/png'
      const buffer = Buffer.from(await res.arrayBuffer())
      const ext = urls[i].split('?')[0].split('.').pop()?.toLowerCase() || 'png'
      const suffix = urls.length > 1 ? `-v${i + 1}` : ''
      const designPath = `${slug}${suffix}.${ext}`

      const { error } = await supabaseAdmin.storage
        .from('designs')
        .upload(designPath, buffer, { contentType, upsert: true })
      if (!error) uploadedFiles.push(designPath)

      // File dau tien: upload tam vao previews de browser lay ve watermark
      if (i === 0 && !error) {
        const tempPath = `${slug}-temp.${ext}`
        await supabaseAdmin.storage.from('previews')
          .upload(tempPath, buffer, { contentType, upsert: true })
        const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(tempPath)
        firstFilePublicUrl = data.publicUrl
      }
    } catch { continue }
  }

  if (!uploadedFiles.length) {
    return NextResponse.json({ error: 'Khong download duoc file nao' }, { status: 400 })
  }

  if (mode === 'fetch_only') {
    // Tra ve thong tin de browser xu ly watermark
    return NextResponse.json({
      slug,
      title,
      category,
      price,
      compare_price,
      files: uploadedFiles,
      first_file_blob_url: firstFilePublicUrl, // browser dung URL nay de watermark
    })
  }

  // mode=full: luu thang vao DB voi preview chua co watermark (fallback)
  const { error: dbErr } = await supabaseAdmin.from('products').insert({
    slug, title, description: '',
    price: parseFloat(price), compare_price: parseFloat(compare_price),
    category, tags: [], file_path: uploadedFiles[0],
    preview_url: firstFilePublicUrl, mockup_urls: [],
    file_info: { dpi: 300, format: 'PNG', size: '', includes: ['PNG transparent'] },
    is_active: true, is_featured: false, download_count: 0,
  })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ success: true, slug, files: uploadedFiles.length })
}

// PUT: nhan preview da co watermark tu browser, upload len previews va luu DB
export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const slug = formData.get('slug') as string
    const previewFile = formData.get('preview') as File
    const title = formData.get('title') as string || slug
    const category = formData.get('category') as string || 'miscellaneous'
    const price = formData.get('price') as string || '3.99'
    const compare_price = formData.get('compare_price') as string || '9.99'

    if (!slug || !previewFile) {
      return NextResponse.json({ error: 'Thieu slug hoac preview' }, { status: 400 })
    }

    // Upload preview co watermark
    const previewBuffer = Buffer.from(await previewFile.arrayBuffer())
    const previewPath = `${slug}-preview.jpg`

    // Xoa file temp neu co
    await supabaseAdmin.storage.from('previews').remove([`${slug}-temp.png`, `${slug}-temp.jpg`])

    const { error: upErr } = await supabaseAdmin.storage
      .from('previews')
      .upload(previewPath, previewBuffer, { contentType: 'image/jpeg', upsert: true })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(previewPath)

    // Lay file_path tu designs bucket
    const { data: files } = await supabaseAdmin.storage.from('designs').list('', {
      search: slug
    })
    const mainFile = files?.find(f => f.name.startsWith(slug))
    const filePath = mainFile ? mainFile.name : `${slug}.png`

    // Luu DB
    const { error: dbErr } = await supabaseAdmin.from('products').insert({
      slug, title, description: '',
      price: parseFloat(price), compare_price: parseFloat(compare_price),
      category, tags: [], file_path: filePath,
      preview_url: data.publicUrl, mockup_urls: [],
      file_info: { dpi: 300, format: 'PNG', size: '', includes: ['PNG transparent'] },
      is_active: true, is_featured: false, download_count: 0,
    })

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json({ success: true, preview_url: data.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
