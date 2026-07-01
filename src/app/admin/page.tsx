'use client'

import { useState, useRef, useEffect } from 'react'
import { CATEGORIES } from '@/types'

interface Product {
  id: string; slug: string; title: string; price: number
  compare_price: number | null; category: string
  is_active: boolean; is_featured: boolean
  preview_url: string; download_count: number
}

interface FormState {
  slug: string; title: string; description: string
  price: string; compare_price: string; category: string
  tags: string; file_info_dpi: string; file_info_size: string
  is_featured: boolean
}

const defaultForm: FormState = {
  slug: '', title: '', description: '',
  price: '2.99', compare_price: '9.99', category: 'western',
  tags: '', file_info_dpi: '300', file_info_size: '4500x5400px',
  is_featured: false,
}


  // Auto detect category tu title
  function detectCategory(title: string): string {
    const t = title.toLowerCase()
    if (/western|cowboy|cowgirl|howdy|rodeo|country|ranch|boots|horsе/.test(t)) return 'western'
    if (/christmas|xmas|santa|holiday|noel|winter|snowflake|reindeer/.test(t)) return 'christmas'
    if (/mama|mom|mother|mommy|grandma|nana|auntie/.test(t)) return 'mama'
    if (/sport|football|baseball|basketball|soccer|hockey|team|league/.test(t)) return 'sports-and-teams'
    if (/halloween|fall|autumn|pumpkin|witch|ghost|spooky|horror/.test(t)) return 'halloween-and-fall'
    if (/christian|faith|jesus|god|cross|church|bible|blessed|pray/.test(t)) return 'christian-and-faith'
    if (/coffee|espresso|latte|cafe|brew|bean/.test(t)) return 'coffee-lovers'
    if (/summer|beach|sun|tropical|ocean|wave|surfing/.test(t)) return 'summer'
    if (/valentine|love|heart|romance|couple|wedding/.test(t)) return 'valentines-day'
    if (/4th|july|patriot|america|usa|flag|freedom|independence/.test(t)) return '4th-of-july'
    if (/tumbler|wrap|cup|mug|bottle|drinkware/.test(t)) return 'tumbler-wraps'
    return 'miscellaneous'
  }

function slugify(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

// Tao preview co watermark bang Canvas (client-side, khong can Sharp)
async function createWatermarkedPreview(input: File | Blob | string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = typeof input === 'string' ? input : URL.createObjectURL(input)
    const needRevoke = typeof input !== 'string'  // revoke ca File lan Blob
    img.onload = () => {
      if (needRevoke) URL.revokeObjectURL(url)

      // Tinh kich thuoc 500px
      const MAX = 500
      let w = img.width, h = img.height
      if (w > h) { h = Math.round(h * MAX / w); w = MAX }
      else { w = Math.round(w * MAX / h); h = MAX }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!

      // Ve anh goc
      ctx.drawImage(img, 0, 0, w, h)

      // Watermark chu cheo
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(-Math.PI / 6)
      ctx.font = `bold ${Math.round(w * 0.08)}px Arial`
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.textAlign = 'center'
      const lineH = Math.round(w * 0.1)
      ctx.fillText('TIKLIFE.SHOP', 0, -lineH)
      ctx.fillText('TIKLIFE.SHOP', 0, 0)
      ctx.fillText('TIKLIFE.SHOP', 0, lineH)
      ctx.restore()

      // Badge do goc duoi phai
      const bh = Math.round(h * 0.08)
      const bw = Math.round(w * 0.42)
      const bx = w - bw - 6
      const by = h - bh - 6
      ctx.fillStyle = 'rgba(233,69,96,0.88)'
      ctx.beginPath()
      ctx.roundRect(bx, by, bw, bh, 4)
      ctx.fill()
      ctx.font = `bold ${Math.round(bh * 0.6)}px Arial`
      ctx.fillStyle = 'white'
      ctx.textAlign = 'center'
      ctx.fillText('tiklife.shop', bx + bw / 2, by + bh * 0.72)

      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/jpeg', 0.85)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

const label: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
}
const input: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1.5px solid #e5e5e5', borderRadius: 8,
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  background: 'white',
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'upload' | 'products' | 'bulk'>('upload')

  // Upload state
  const [form, setForm] = useState<FormState>(defaultForm)
    const [previewUrl, setPreviewUrl] = useState<string>('')   // preview da co watermark
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const designRef = useRef<HTMLInputElement>(null)
  const previewBoxRef = useRef<HTMLDivElement>(null)
  // Xu ly paste anh tu clipboard (Ctrl+V hoac screenshot)
  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItem = items.find(item => item.type.startsWith('image/'))
      if (!imageItem) return

      e.preventDefault()
      const blob = imageItem.getAsFile()
      if (!blob) return

      // Dung thang anh goc (watermark tam thoi tat)
      const url = URL.createObjectURL(blob)
      setPastedPreview(blob)
      setPastedPreviewUrl(url)
      setPreviewBlob(blob)
      setPreviewUrl(url)
      log('Da dan anh preview!')
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  // Paste preview state
  const [pastedPreview, setPastedPreview] = useState<Blob | null>(null)
  const [pastedPreviewUrl, setPastedPreviewUrl] = useState('')

  const [designFile, setDesignFile] = useState<File | null>(null)
  const [uploadTarget, setUploadTarget] = useState<'supabase' | 'r2'>('r2')

  // Bulk upload state
  const [bulkProducts, setBulkProducts] = useState([
    { title: '', urls: '', category: 'miscellaneous', price: '3.99' }
  ])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResults, setBulkResults] = useState<any[]>([])

  function log(msg: string) { setLogs(p => [...p, msg]) }

  // Đọc response an toàn — Vercel có thể trả text thô (413, 502...) thay vì JSON
  async function safeJson(res: Response) {
    const text = await res.text()
    if (res.status === 413) throw new Error('File quá lớn (giới hạn 4.5MB trên Vercel Hobby). Hãy nén ZIP hoặc giảm kích thước ảnh.')
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Lỗi server ${res.status}: ${text.slice(0, 120)}`)
    }
  }


  // Upload file trực tiếp lên Supabase Storage qua presigned URL (bỏ qua Vercel 4.5MB limit)
  async function uploadFileDirect(
    file: Blob | File,
    type: string,
    slug: string,
    filename?: string,
    varIndex?: number,
    varLabel?: string,
  ): Promise<string> {
    const fname = filename || (file instanceof File ? file.name : type === 'preview' ? 'preview.jpg' : 'design.bin')

    log('Lấy presigned URL...')
    const urlRes = await fetch('/api/admin/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ type, slug, filename: fname, var_index: varIndex, var_label: varLabel }),
    })
    const urlData = await safeJson(urlRes)
    if (!urlRes.ok) throw new Error(urlData.error)

    const { signedUrl, path, bucket } = urlData

    log('Uploading thẳng lên Supabase...')
    const contentType = type === 'preview' ? 'image/jpeg' : (file instanceof File ? file.type : 'application/octet-stream')
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'x-upsert': 'true' },
      body: file,
    })
    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      throw new Error(`Upload thất bại (${uploadRes.status}): ${errText.slice(0, 120)}`)
    }

    if (type === 'preview') {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
    }
    return path
  }

  // Upload file trực tiếp lên Cloudflare R2 qua presigned URL
  async function uploadFileToR2(
    file: File,
    type: string,
    slug: string,
  ): Promise<string> {
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) {
      throw new Error(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Giới hạn R2: ${MAX_MB} MB.`)
    }

    const ALLOWED = ['png', 'jpg', 'jpeg', 'svg', 'zip']
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED.includes(ext)) {
      throw new Error(`Loại file không hợp lệ (.${ext}). Chỉ chấp nhận: ${ALLOWED.join(', ')}`)
    }

    log('Lấy R2 presigned URL...')
    const urlRes = await fetch('/api/admin/r2-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ type, slug, filename: file.name }),
    })
    const urlData = await safeJson(urlRes)
    if (!urlRes.ok) throw new Error(urlData.error)

    const { signedUrl, key } = urlData

    // Log domain để debug (xóa sau khi xác nhận hoạt động)
    try {
      const urlHost = new URL(signedUrl).hostname
      log(`R2 endpoint: ${urlHost}`)
    } catch {}

    log('Uploading thẳng lên R2...')
    let uploadRes: Response
    try {
      uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
    } catch (fetchErr: any) {
      throw new Error(`Không kết nối được R2 (CORS hoặc URL sai): ${fetchErr.message}. Kiểm tra CORS trong Cloudflare R2 Dashboard và env vars CLOUDFLARE_R2_* trong Vercel.`)
    }
    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      throw new Error(`R2 upload thất bại (${uploadRes.status}): ${errText.slice(0, 200)}`)
    }

    return key
  }

  // Auto generate tags tu title
  function generateTags(title: string): string {
    const t = title.toLowerCase()
    const tags: string[] = []

    // Niche tags
    if (/western|cowboy|cowgirl|howdy|rodeo|country|ranch/.test(t)) tags.push('western', 'country', 'cowgirl', 'dtf')
    if (/christmas|xmas|santa|holiday|noel/.test(t)) tags.push('christmas', 'holiday', 'santa', 'xmas')
    if (/mama|mom|mother|mommy/.test(t)) tags.push('mama', 'mom', 'mother', 'mothers-day')
    if (/grandma|nana|granny/.test(t)) tags.push('grandma', 'nana', 'grandmother')
    if (/sport|football|baseball|basketball|soccer/.test(t)) tags.push('sports', 'team', 'game-day')
    if (/halloween|fall|pumpkin|witch/.test(t)) tags.push('halloween', 'fall', 'spooky', 'autumn')
    if (/christian|faith|jesus|god|cross|blessed/.test(t)) tags.push('christian', 'faith', 'religious', 'blessed')
    if (/coffee|latte|espresso|cafe/.test(t)) tags.push('coffee', 'coffee-lover', 'cafe')
    if (/summer|beach|tropical|ocean/.test(t)) tags.push('summer', 'beach', 'vacation')
    if (/valentine|love|heart/.test(t)) tags.push('valentine', 'love', 'heart', 'romantic')
    if (/tumbler|wrap|mug|cup/.test(t)) tags.push('tumbler', 'tumbler-wrap', 'drinkware')
    if (/4th|july|patriot|america|usa/.test(t)) tags.push('4th-of-july', 'patriotic', 'america', 'usa')

    // Format tags
    if (/png/.test(t)) tags.push('png')
    if (/sublimation/.test(t)) tags.push('sublimation')
    if (/dtf/.test(t)) tags.push('dtf')

    // Luon them cac tag chung
    tags.push('png-design', 'commercial-use', 'instant-download', 'printify', 'printful')

    return [...new Set(tags)].join(', ')
  }

  // Auto generate description tu title
  function generateDescription(title: string, category: string): string {
    const catLabels: Record<string, string> = {
      'western': 'Western & Country',
      'christmas': 'Christmas',
      'mama': 'Mom & Family',
      'sports-and-teams': 'Sports & Teams',
      'halloween-and-fall': 'Halloween & Fall',
      'christian-and-faith': 'Christian & Faith',
      'coffee-lovers': 'Coffee Lovers',
      'summer': 'Summer',
      'valentines-day': "Valentine's Day",
      '4th-of-july': '4th of July',
      'tumbler-wraps': 'Tumbler Wraps',
      'miscellaneous': 'General',
    }
    const catLabel = catLabels[category] || category
    return `High-quality ${title} PNG design for sublimation, DTF printing, and print-on-demand. Perfect for ${catLabel} themed products including t-shirts, hoodies, tumblers, and mugs. 300 DPI transparent background. Instant digital download. Commercial license included — sell unlimited products on Printify, Printful, Etsy, and more.`
  }

  function cleanTitle(title: string): string {
    return title
      .replace(/\bt[-\s]?shirts?\b/gi, 'PNG Design')
      .replace(/\bunisex\s+t[-\s]?shirts?\b/gi, 'PNG Design')
      .replace(/\btees?\b/gi, 'PNG')
      .replace(/\bshirts?\b/gi, 'PNG Design')
      .replace(/\bhoodies?\b/gi, 'PNG Design')
      .replace(/\bsweatshirts?\b/gi, 'PNG Design')
      .replace(/\btank\s*tops?\b/gi, 'PNG Design')
      .replace(/\bpullovers?\b/gi, 'PNG Design')
      .replace(/\bcrewnecks?\b/gi, 'PNG Design')
      .replace(/\bGraphic\s+Tee\b/gi, 'PNG Design')
      .replace(/\b(Classic|Slim|Regular)\s+Fit\b/gi, '')
      .replace(/\bMenswear\b/gi, 'Design')
      .replace(/\bWomenswear\b/gi, 'Design')
      .replace(/\bApparel\b/gi, 'PNG')
      .replace(/\bClothing\b/gi, 'PNG Design')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  function handleTitleChange(val: string) {
    val = cleanTitle(val)
    const autoCategory = detectCategory(val)
    const autoTags = generateTags(val)
    const autoDesc = generateDescription(val, autoCategory)
    setForm(f => ({
      ...f,
      title: val,
      slug: f.slug === slugify(f.title) || !f.slug ? slugify(val) : f.slug,
      category: autoCategory,
      tags: autoTags,
      description: autoDesc,
    }))
  }

  function handleDesignFile(file: File) {
    setDesignFile(file)
  }

  async function uploadFile(blob: Blob | File, type: string, slug: string): Promise<string> {
    const fd = new FormData()
    fd.append('file', blob, type === 'design' ? (designFile?.name || 'design.png') : 'preview.jpg')
    fd.append('type', type)
    fd.append('slug', slug)
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey },
      body: fd,
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data.error)
    return type === 'design' ? data.data.file_path : data.data.preview_url
  }

  async function handleSubmit() {
    setErrorMsg(''); setSuccessMsg(''); setLogs([])
    if (!form.slug || !form.title || !form.price) {
      setErrorMsg('Vui long dien: Ten, Slug, Gia'); return
    }
    if (!designFile) { setErrorMsg('Chua chon file design'); return }
    if (!previewBlob) { setErrorMsg('Chua co preview'); return }

    setUploading(true)
    try {
      if (!designFile) throw new Error('Chua chon file design')

      log('Uploading design file...')
      const filePath = uploadTarget === 'r2'
        ? await uploadFileToR2(designFile, 'design', form.slug)
        : await uploadFileDirect(designFile, 'design', form.slug, designFile.name)
      log('Design uploaded: ' + filePath)

      // Uu tien pasted preview, neu khong co thi dung auto watermark
      const finalPreview = pastedPreview || previewBlob
      if (!finalPreview) throw new Error('Chua co preview')
      log('Upload preview...')
      const pUrl = await uploadFileDirect(finalPreview, 'preview', form.slug, 'preview.jpg')
      log('Upload preview OK!')

      log('Luu vao database...')
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          slug: form.slug, title: form.title,
          description: form.description,
          price: form.price, compare_price: form.compare_price || null,
          category: form.category,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          file_path: filePath, preview_url: pUrl,
          mockup_urls: [],
          file_info: {
            dpi: parseInt(form.file_info_dpi) || 300,
            format: designFile?.name.endsWith('.zip') ? 'ZIP' : 'PNG',
            size: form.file_info_size,
            includes: designFile?.name.endsWith('.zip') ? ['ZIP file with all variations'] : ['PNG transparent'],
          },
          is_featured: form.is_featured,
        }),
      })
      const result = await safeJson(res)
      if (!res.ok) throw new Error(result.error)

      log('Thanh cong!')
      setSuccessMsg(`"${form.title}" da them vao shop!`)
      setForm(defaultForm)
      setDesignFile(null)
      setPastedPreview(null)
      setPastedPreviewUrl('')
      setPreviewUrl('')
      setPreviewBlob(null)
    } catch (err: any) {
      setErrorMsg('Loi: ' + err.message)
    }
    setUploading(false)
  }

  async function loadProducts() {
    setLoadingProducts(true)
    const res = await fetch('/api/admin/products', { headers: { 'x-admin-key': adminKey } })
    const data = await res.json()
    setProducts(data.data || [])
    setLoadingProducts(false)
  }

  async function toggleActive(p: Product) {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
    })
    loadProducts()
  }

  async function toggleFeatured(p: Product) {
    await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id: p.id, is_featured: !p.is_featured }),
    })
    loadProducts()
  }

  // LOGIN
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Admin Login</h1>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Nhap Admin Secret Key</p>
          <input type="password" placeholder="Admin key..." value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adminKey && setAuthed(true)}
            style={{ ...input, marginBottom: 12 }} />
          <button onClick={() => adminKey && setAuthed(true)}
            style={{ width: '100%', height: 44, background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Dang nhap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      {/* Header */}
      <div style={{ background: 'var(--brand)', color: 'white', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Tiklife Admin</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['upload', 'bulk', 'products'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'products') loadProducts() }}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === t ? 'var(--brand-accent)' : 'rgba(255,255,255,0.15)', color: 'white' }}>
              {t === 'upload' ? 'Upload Design' : t === 'bulk' ? 'Bulk URL Upload' : 'Quan ly Products'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* UPLOAD TAB */}
        {tab === 'upload' && (
          <div className='admin-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* LEFT: Design file + Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Storage target toggle */}
              <div style={{ background: 'white', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Upload tới:</span>
                {(['r2', 'supabase'] as const).map(t => (
                  <button key={t} onClick={() => setUploadTarget(t)}
                    style={{
                      padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: 12,
                      background: uploadTarget === t ? (t === 'r2' ? '#ea580c' : '#2563eb') : '#f3f4f6',
                      color: uploadTarget === t ? 'white' : '#555',
                      transition: 'all 0.15s',
                    }}>
                    {t === 'r2' ? 'Cloudflare R2 (≤50MB)' : 'Supabase (≤500MB bucket)'}
                  </button>
                ))}
              </div>

              {/* ZIP / PNG upload - ho tro keo tha */}
              <div
                onClick={() => designRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = uploadTarget === 'r2' ? '#ea580c' : '#e94560'; e.currentTarget.style.background = uploadTarget === 'r2' ? '#fff7ed' : '#fff5f6' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = designFile ? '#16a34a' : (uploadTarget === 'r2' ? '#fed7aa' : '#e5e5e5'); e.currentTarget.style.background = 'white' }}
                onDrop={e => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = designFile ? '#16a34a' : (uploadTarget === 'r2' ? '#fed7aa' : '#e5e5e5')
                  e.currentTarget.style.background = 'white'
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleDesignFile(file)
                }}
                style={{
                  background: 'white', borderRadius: 14,
                  border: designFile ? '2px solid #16a34a' : (uploadTarget === 'r2' ? '2px dashed #fed7aa' : '2px dashed #e5e5e5'),
                  cursor: 'pointer', minHeight: 160,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: 24, textAlign: 'center', gap: 10,
                  transition: 'all 0.15s',
                }}>
                <input ref={designRef} type="file" accept=".zip,.png,.jpg,.jpeg,.svg" hidden
                  onChange={e => e.target.files?.[0] && handleDesignFile(e.target.files[0])} />
                {designFile ? (
                  <>
                    <div style={{ fontSize: 40 }}>{designFile.name.endsWith('.zip') ? '🗜️' : '🎨'}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#16a34a' }}>{designFile.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {(designFile.size / 1024 / 1024).toFixed(1)} MB · Click hoặc kéo thả để đổi file
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 44 }}>{uploadTarget === 'r2' ? '☁️' : '📦'}</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {uploadTarget === 'r2' ? 'R2 Upload — Max 50MB' : 'Drop file here or click to browse'}
                    </div>
                    <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.7 }}>
                      {uploadTarget === 'r2'
                        ? <><strong style={{ color: '#ea580c' }}>PNG · JPG · SVG · ZIP</strong> — Upload thẳng lên Cloudflare R2</>
                        : <><strong style={{ color: '#555' }}>ZIP</strong> (all variations) · <strong style={{ color: '#555' }}>PNG</strong> · JPG · SVG</>}
                    </div>
                  </>
                )}
              </div>

              {/* Preview box */}
              <div style={{
                background: 'white', borderRadius: 12, overflow: 'hidden',
                border: pastedPreviewUrl ? '2px solid #6366f1' : '2px dashed #e5e5e5',
                minHeight: 100,
              }}>
                <div style={{
                  padding: '8px 12px', fontSize: 11, fontWeight: 700,
                  color: pastedPreviewUrl ? '#6366f1' : '#aaa',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  <span>{pastedPreviewUrl ? '📋 Preview (Pasted)' : '🖼️ Preview Image'}</span>
                  {pastedPreviewUrl && (
                    <button onClick={() => { setPastedPreview(null); setPastedPreviewUrl(''); setPreviewBlob(null); setPreviewUrl('') }}
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid #e5e5e5', background: 'white', cursor: 'pointer', color: '#888' }}>
                      Clear
                    </button>
                  )}
                </div>
                {pastedPreviewUrl || previewUrl ? (
                  <img src={pastedPreviewUrl || previewUrl} alt="preview"
                    style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: '#ccc' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#bbb' }}>
                      Press <kbd style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, color: '#666', fontFamily: 'monospace', fontSize: 11 }}>Ctrl+V</kbd> to paste screenshot
                    </div>
                    <div style={{ fontSize: 11, color: '#ddd', marginTop: 4 }}>This will be shown to customers</div>
                  </div>
                )}
              </div>

              {/* Logs */}
              {logs.length > 0 && (
                <div style={{ background: 'white', borderRadius: 10, padding: '12px 16px' }}>
                  {logs.map((l, i) => <div key={i} style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>{l}</div>)}
                </div>
              )}
            </div>

            {/* RIGHT: Form */}
            <div style={{ background: 'white', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={label}>Ten design *</label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Howdy PNG | Western DTF Design" style={input} />
              </div>
              <div>
                <label style={label}>Slug (URL) *</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="howdy-western-dtf" style={input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={label}>Gia ban ($) *</label>
                  <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    type="number" step="0.01" style={input} />
                </div>
                <div>
                  <label style={label}>Gia goc ($)</label>
                  <input value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))}
                    type="number" step="0.01" style={input} />
                </div>
              </div>
              <div>
                <label style={label}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...input, background: 'white' }}>
                  {CATEGORIES.slice(1).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Tags (cach nhau bang dau phay)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="dtf, sublimation, western" style={input} />
              </div>
              <div>
                <label style={label}>Mo ta</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} style={{ ...input, height: 'auto', resize: 'vertical' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={label}>DPI</label>
                  <input value={form.file_info_dpi} onChange={e => setForm(f => ({ ...f, file_info_dpi: e.target.value }))} style={input} />
                </div>
                <div>
                  <label style={label}>Kich thuoc</label>
                  <input value={form.file_info_size} onChange={e => setForm(f => ({ ...f, file_info_size: e.target.value }))} style={input} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                Featured (hien tren Homepage)
              </label>

              {errorMsg && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{errorMsg}</div>}
              {successMsg && <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>{successMsg}</div>}

              <button onClick={handleSubmit} disabled={uploading || !previewBlob}
                style={{ height: 52, background: (!previewBlob || uploading) ? '#ccc' : 'var(--brand-accent)', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: (!previewBlob || uploading) ? 'not-allowed' : 'pointer' }}>
                {uploading ? 'Dang upload...' : 'Upload & Them vao Shop'}
              </button>
            </div>
          </div>
        )}


        {/* BULK UPLOAD TAB */}
        {tab === 'bulk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20 }}>Upload nhieu san pham tu URL</h2>
              <button onClick={() => setBulkProducts(p => [...p, { title: '', urls: '', category: 'miscellaneous', price: '3.99' }])}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--brand)', background: 'white', color: 'var(--brand)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                + Them san pham
              </button>
            </div>

            {bulkProducts.map((bp, idx) => (
              <div key={idx} style={{ background: 'white', borderRadius: 16, padding: 22, border: '1.5px solid #e5e5e5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#888' }}>San pham #{idx + 1}</span>
                  {bulkProducts.length > 1 && (
                    <button onClick={() => setBulkProducts(p => p.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}>×</button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Ten san pham *</label>
                    <input value={bp.title}
                      onChange={e => setBulkProducts(p => p.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))}
                      placeholder="Howdy Western PNG Design"
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Category</label>
                    <select value={bp.category}
                      onChange={e => setBulkProducts(p => p.map((x, i) => i === idx ? { ...x, category: e.target.value } : x))}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 13, background: 'white', boxSizing: 'border-box' as const }}>
                      {CATEGORIES.slice(1).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Gia ($)</label>
                    <input value={bp.price} type="number" step="0.01"
                      onChange={e => setBulkProducts(p => p.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
                    Links PNG (moi dong 1 link — dark version, light version, v.v.)
                  </label>
                  <textarea value={bp.urls}
                    onChange={e => setBulkProducts(p => p.map((x, i) => i === idx ? { ...x, urls: e.target.value } : x))}
                    placeholder={'https://example.com/design-dark.png\nhttps://example.com/design-light.png'}
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    {bp.urls.split('\n').filter(u => u.trim().startsWith('http')).length} links — link dau tien se dung lam anh preview
                  </div>
                </div>

                {bulkResults[idx] && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: bulkResults[idx].status === 'OK' ? '#d1fae5' : '#fee2e2', fontSize: 12, color: bulkResults[idx].status === 'OK' ? '#065f46' : '#991b1b' }}>
                    {bulkResults[idx].status === 'OK' ? '✅ Da them vao shop!' : '❌ ' + bulkResults[idx].error}
                  </div>
                )}
              </div>
            ))}

            <button
              disabled={bulkLoading}
              onClick={async () => {
                setBulkLoading(true)
                setBulkResults([])
                const newResults: any[] = []

                for (const bp of bulkProducts) {
                  if (!bp.title || !bp.urls.trim()) {
                    newResults.push({ status: 'ERROR', error: 'Thieu ten hoac URL' })
                    continue
                  }
                  const urls = bp.urls.split('\n').map((u: string) => u.trim()).filter((u: string) => u.startsWith('http'))
                  if (!urls.length) { newResults.push({ status: 'ERROR', error: 'Khong co URL hop le' }); continue }

                  try {
                    // Buoc 1: lay file tu URL qua proxy
                    const proxyRes = await fetch('/api/admin/bulk-upload', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
                      body: JSON.stringify({ title: bp.title, urls, category: bp.category, price: bp.price, mode: 'fetch_only' }),
                    })
                    const proxyData = await proxyRes.json()
                    if (proxyData.error) { newResults.push({ status: 'ERROR', error: proxyData.error }); continue }

                    // Buoc 2: browser them watermark bang Canvas
                    const previewBlob = await createWatermarkedPreview(proxyData.first_file_blob_url)

                    // Buoc 3: upload preview co watermark len server
                    const fd = new FormData()
                    fd.append('slug', proxyData.slug)
                    fd.append('title', bp.title)
                    fd.append('category', bp.category)
                    fd.append('price', bp.price)
                    fd.append('compare_price', '9.99')
                    fd.append('preview', previewBlob, 'preview.jpg')
                    const saveRes = await fetch('/api/admin/bulk-upload', {
                      method: 'PUT',
                      headers: { 'x-admin-key': adminKey },
                      body: fd,
                    })
                    const saveData = await saveRes.json()
                    newResults.push(saveData.error ? { status: 'ERROR', error: saveData.error } : { status: 'OK' })
                  } catch(e: any) {
                    newResults.push({ status: 'ERROR', error: e.message })
                  }
                }
                setBulkResults(newResults)
                setBulkLoading(false)
              }}
              style={{ height: 54, background: bulkLoading ? '#ccc' : 'var(--brand-accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: bulkLoading ? 'not-allowed' : 'pointer' }}>
              {bulkLoading ? 'Dang xu ly...' : `Upload ${bulkProducts.length} san pham`}
            </button>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20 }}>Tat ca Products ({products.length})</h2>
              <button onClick={loadProducts} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e5e5', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                Refresh
              </button>
            </div>
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Dang tai...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {products.map(p => (
                  <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, border: p.is_active ? '1px solid #e5e5e5' : '1px solid #fee2e2', opacity: p.is_active ? 1 : 0.6 }}>
                    <img src={p.preview_url} alt={p.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{p.category} · ${p.price} · {p.download_count} downloads</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleFeatured(p)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e5e5', background: p.is_featured ? '#fef9c3' : 'white', cursor: 'pointer', fontSize: 12 }}>
                        {p.is_featured ? 'Featured' : 'Feature'}
                      </button>
                      <button onClick={() => toggleActive(p)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: p.is_active ? '#fee2e2' : '#d1fae5', color: p.is_active ? '#991b1b' : '#065f46', cursor: 'pointer', fontSize: 12 }}>
                        {p.is_active ? 'An' : 'Hien'}
                      </button>
                      <a href={`/products/${p.slug}`} target="_blank" style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e5e5', background: 'white', fontSize: 12, textDecoration: 'none', color: '#333' }}>Xem</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
