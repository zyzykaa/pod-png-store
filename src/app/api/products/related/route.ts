import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '4')

  if (!productId || !category) {
    return NextResponse.json({ error: 'Thieu product_id hoac category' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Cung category, khac product hien tai, uu tien featured + moi
  const { data: sameCategory } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)
    .neq('id', productId)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  let results = sameCategory || []

  // Neu khong du, lay them tu category khac (newest)
  if (results.length < limit) {
    const { data: others } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .neq('id', productId)
      .not('id', 'in', `(${results.map(p => p.id).join(',') || 'null'})`)
      .order('created_at', { ascending: false })
      .limit(limit - results.length)

    results = [...results, ...(others || [])]
  }

  return NextResponse.json({ data: results })
}
