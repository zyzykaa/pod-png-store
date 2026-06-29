import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'newest'
  const minPrice = parseFloat(searchParams.get('min_price') || '0')
  const maxPrice = parseFloat(searchParams.get('max_price') || '999')
  const featured = searchParams.get('featured')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '24')
  const offset = (page - 1) * limit

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .gte('price', minPrice)
    .lte('price', maxPrice)
    .range(offset, offset + limit - 1)

  // Sort
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false }); break
    case 'oldest':
      query = query.order('created_at', { ascending: true }); break
    case 'price_asc':
      query = query.order('price', { ascending: true }); break
    case 'price_desc':
      query = query.order('price', { ascending: false }); break
    case 'popular':
      query = query.order('download_count', { ascending: false }); break
    case 'featured':
      query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false }); break
    default:
      query = query.order('created_at', { ascending: false })
  }

  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  if (featured === 'true') query = query.eq('is_featured', true)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
  })
}
