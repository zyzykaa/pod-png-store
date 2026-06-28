import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(request: NextRequest) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET_KEY
}

// Rebuild preview: download design goc -> upload len Supabase previews
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, slug, file_path')
    .eq('is_active', true)

  if (!products?.length) {
    return NextResponse.json({ error: 'No products' }, { status: 404 })
  }

  const results = []

  for (const product of products) {
    try {
      const cleanPath = product.file_path.replace(/^designs\//, '')
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('designs').download(cleanPath)

      if (dlErr || !fileData) {
        results.push({ slug: product.slug, status: 'FAIL: ' + (dlErr?.message || 'no data') })
        continue
      }

      // Upload thang file goc len previews (client se them watermark khi hien thi)
      const buffer = Buffer.from(await fileData.arrayBuffer())
      const previewPath = `${product.slug}-preview.png`
      const { error: upErr } = await supabaseAdmin.storage
        .from('previews')
        .upload(previewPath, buffer, { contentType: 'image/png', upsert: true })

      if (upErr) {
        results.push({ slug: product.slug, status: 'FAIL upload: ' + upErr.message })
        continue
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('previews').getPublicUrl(previewPath)

      await supabaseAdmin.from('products')
        .update({ preview_url: urlData.publicUrl })
        .eq('slug', product.slug)

      results.push({ slug: product.slug, status: 'OK', url: urlData.publicUrl })
    } catch (err: any) {
      results.push({ slug: product.slug, status: 'ERROR: ' + err.message })
    }
  }

  return NextResponse.json({ results })
}
