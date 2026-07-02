import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkAuth(request: NextRequest) {
  const adminPass = request.headers.get('x-admin-key')
  return adminPass === process.env.ADMIN_SECRET_KEY
}

// Tạo product mới
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      slug, title, description, price, compare_price,
      category, tags, file_path, preview_url, mockup_urls, file_info,
      is_featured, seo_title, seo_description
    } = body

    // Validate bắt buộc
    if (!slug || !title || !price || !category || !file_path || !preview_url) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: slug, title, price, category, file_path, preview_url' },
        { status: 400 }
      )
    }

    // Kiểm tra slug đã tồn tại chưa
    const { data: existing } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" đã tồn tại` }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        slug,
        title,
        description: description || null,
        price: parseFloat(price),
        compare_price: compare_price ? parseFloat(compare_price) : null,
        category,
        tags: tags || [],
        file_path,
        preview_url,
        mockup_urls: mockup_urls || [],
        file_info: file_info || {},
        is_featured: is_featured || false,
        is_active: true,
        seo_title: seo_title || null,
        seo_description: seo_description || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Lấy danh sách products (kể cả inactive)
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// Update product
export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Xóa product
export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
