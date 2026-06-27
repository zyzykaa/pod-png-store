'use client'

import { useState, useRef } from 'react'
import { CATEGORIES } from '@/types'

interface Product {
  id: string; slug: string; title: string; price: number
  compare_price: number | null; category: string
  is_active: boolean; is_featured: boolean
  preview_url: string; download_count: number; created_at: string
}

interface FormState {
  slug: string; title: string; description: string
  price: string; compare_price: string; category: string
  tags: string; file_info_dpi: string; file_info_size: string
  file_info_includes: string; is_featured: boolean
}

const defaultForm: FormState = {
  slug: '', title: '', description: '',
  price: '3.99', compare_price: '9.99', category: 'western',
  tags: '', file_info_dpi: '300', file_info_size: '4500x5400px',
  file_info_includes: 'PNG transparent, PNG white bg', is_featured: false,
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'upload' | 'products'>('upload')

  const [form, setForm] = useState<FormState>(defaultForm)
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [previewBlob, setPreviewBlob] = useState<string | null>(null) // preview cục bộ
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const designRef = useRef<HTMLInputElement>(null)

  function generateSlug(title: string) {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60)
  }

  function handleTitleChange(val: string) {
    setForm(f => ({
      ...f, title: val,
      slug: f.slug === generateSlug(f.title) || f.slug === '' ? generateSlug(val) : f.slug,
    }))
  }

  // Khi chọn file design PNG → hiện preview ngay trên UI
  function handleDesignFile(file: File) {
    setDesignFile(file)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (['png','jpg','jpeg','webp'].includes(ext || '')) {
      setPreviewBlob(URL.createObjectURL(file))
    } else {
      setPreviewBlob(null)
    }
  }

  async function loadProducts() {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/admin/products', { headers: { 'x-admin-key': adminKey } })
      const data = await res.json()
      setProducts(data.data || [])
    } catch(e) { console.error(e) }
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

  async function handleSubmit() {
    setErrorMsg(''); setSuccessMsg(''); setUploadProgress([])
    if (!form.slug || !form.title || !form.price || !form.category) {
      setErrorMsg('Vui lòng điền đầy đủ: Slug, Tên, Giá, Category'); return
    }
    if (!designFile) {
      setErrorMsg('Chưa chọn file design PNG'); return
    }

    setUploading(true)
    const log = (msg: string) => setUploadProgress(p => [...p, msg])

    try {
      // Upload design → server tự tạo preview có watermark
      log('⬆️ Đang upload file design...')
      const fd = new FormData()
      fd.append('file', designFile)
      fd.append('type', 'design')
      fd.append('slug', form.slug)

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: fd,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error)

      const filePath = uploadData.data.file_path
      const previewUrl = uploadData.data.preview_url
      log('✅ Upload xong! Preview đã tự động tạo với watermark Tiklife.')

      if (!previewUrl) throw new Error('File không phải PNG/JPG. Vui lòng upload file ảnh.')

      log('💾 Đang lưu vào database...')
      const saveRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          description: form.description,
          price: form.price,
          compare_price: form.compare_price || null,
          category: form.category,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          file_path: filePath,
          preview_url: previewUrl,
          mockup_urls: [],
          file_info: {
            dpi: parseInt(form.file_info_dpi) || 300,
            format: 'PNG',
            size: form.file_info_size,
            includes: form.file_info_includes.split(',').map(s => s.trim()),
          },
          is_featured: form.is_featured,
        }),
      })

      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error)

      log('🎉 Đã thêm design vào shop thành công!')
      setSuccessMsg(`✅ "${form.title}" đã live trên tiklife.shop!`)
      setForm(defaultForm)
      setDesignFile(null)
      setPreviewBlob(null)
    } catch (err: any) {
      setErrorMsg('❌ Lỗi: ' + err.message)
    }
    setUploading(false)
  }

  // ===== LOGIN =====
  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-soft)',
      }}>
        <div style={{
          background: 'white', borderRadius: 16, padding: 40,
          width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>🔐 Admin Login</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Nhập Admin Secret Key để tiếp tục
          </p>
          <input
            type="password"
            placeholder="Admin secret key..."
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adminKey && setAuthed(true)}
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <button onClick={() => adminKey && setAuthed(true)} style={{
            width: '100%', height: 44, background: 'var(--brand)',
            color: 'white', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Đăng nhập
          </button>
        </div>
      </div>
    )
  }

  // ===== MAIN =====
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-soft)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--brand)', color: 'white',
        padding: '16px 32px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>🛠 Tiklife Admin</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['upload', 'products'] as const).map(t => (
            <button key={t}
              onClick={() => { setTab(t); if (t === 'products') loadProducts() }}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: 13,
                background: tab === t ? 'var(--brand-accent)' : 'rgba(255,255,255,0.15)',
                color: 'white',
              }}>
              {t === 'upload' ? '⬆️ Upload Design' : '📋 Quản lý Products'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* ===== TAB UPLOAD ===== */}
        {tab === 'upload' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* LEFT: Upload box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Design file + preview tự động */}
              <div
                onClick={() => designRef.current?.click()}
                style={{
                  background: 'white', borderRadius: 16,
                  border: designFile ? '2px solid #16a34a' : '2px dashed var(--border)',
                  cursor: 'pointer', overflow: 'hidden',
                  minHeight: 280, position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <input
                  ref={designRef} type="file" accept=".png,.jpg,.jpeg,.webp,.zip" hidden
                  onChange={e => e.target.files?.[0] && handleDesignFile(e.target.files[0])}
                />

                {previewBlob ? (
                  <>
                    {/* Preview ảnh gốc (chưa có watermark) */}
                    <img src={previewBlob} alt="preview"
                      style={{ width: '100%', height: 260, objectFit: 'contain' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(22,163,74,0.92)', color: 'white',
                      padding: '8px 12px', fontSize: 12, fontWeight: 600,
                      textAlign: 'center',
                    }}>
                      ✅ {designFile?.name} · Server sẽ tự thêm watermark Tiklife
                    </div>
                  </>
                ) : designFile ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                    <div style={{ fontWeight: 600, color: '#16a34a' }}>✅ {designFile.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>ZIP file đã chọn</div>
                  </div>
                ) : (
                  <div style={{ padding: 32, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                      Upload file PNG Design
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      Chỉ cần upload <strong>1 file PNG</strong><br/>
                      Server sẽ tự động:<br/>
                      ✅ Lưu file gốc (private)<br/>
                      ✅ Tạo preview có watermark Tiklife
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark preview badge */}
              {previewBlob && (
                <div style={{
                  background: '#fef9c3', border: '1px solid #fde047',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13,
                  color: '#713f12', lineHeight: 1.5,
                }}>
                  ⚡ Preview trên sẽ được thêm:<br/>
                  • Chữ <strong>TIKLIFE.SHOP</strong> chéo ở giữa<br/>
                  • Badge đỏ <strong>tiklife.shop</strong> góc dưới phải<br/>
                  • Badge <strong>PREVIEW</strong> góc trên trái
                </div>
              )}
            </div>

            {/* RIGHT: Form */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div>
                <label style={labelStyle}>Tên design *</label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Howdy PNG | Western Sublimation Design | DTF Ready"
                  style={inputStyle} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  Format tốt: "Tên | Niche | DTF/Sublimation"
                </div>
              </div>

              <div>
                <label style={labelStyle}>Slug (URL) *</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="howdy-western-sublimation" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Giá bán ($) *</label>
                  <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="3.99" type="number" step="0.01" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Giá gốc ($)</label>
                  <input value={form.compare_price} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value }))}
                    placeholder="9.99" type="number" step="0.01" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ ...inputStyle, background: 'white' }}>
                  {CATEGORIES.slice(1).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tags (cách nhau bằng dấu phẩy)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="dtf, sublimation, western, cowgirl" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Mô tả</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả ngắn về design..."
                  rows={3} style={{ ...inputStyle, height: 'auto', resize: 'vertical' as const }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>DPI</label>
                  <input value={form.file_info_dpi}
                    onChange={e => setForm(f => ({ ...f, file_info_dpi: e.target.value }))}
                    placeholder="300" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Kích thước</label>
                  <input value={form.file_info_size}
                    onChange={e => setForm(f => ({ ...f, file_info_size: e.target.value }))}
                    placeholder="4500x5400px" style={inputStyle} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.is_featured}
                  onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                ⭐ Đánh dấu Featured (hiện trên Homepage)
              </label>

              {errorMsg && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  {successMsg}
                </div>
              )}
              {uploadProgress.length > 0 && (
                <div style={{ background: 'var(--bg-soft)', borderRadius: 8, padding: '10px 14px' }}>
                  {uploadProgress.map((msg, i) => (
                    <div key={i} style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-muted)' }}>{msg}</div>
                  ))}
                </div>
              )}

              <button onClick={handleSubmit} disabled={uploading} style={{
                height: 52, background: uploading ? '#ccc' : 'var(--brand-accent)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 16, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}>
                {uploading ? '⏳ Đang xử lý...' : '🚀 Upload & Thêm vào Shop'}
              </button>
            </div>
          </div>
        )}

        {/* ===== TAB PRODUCTS ===== */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20 }}>Tất cả Products ({products.length})</h2>
              <button onClick={loadProducts} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'white', cursor: 'pointer', fontSize: 13,
              }}>🔄 Refresh</button>
            </div>

            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Đang tải...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {products.map(p => (
                  <div key={p.id} style={{
                    background: 'white', borderRadius: 12, padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    border: p.is_active ? '1px solid var(--border)' : '1px solid #fee2e2',
                    opacity: p.is_active ? 1 : 0.6,
                  }}>
                    <img
                      src={p.preview_url.includes('supabase.co')
                        ? `/api/image?url=${encodeURIComponent(p.preview_url)}`
                        : p.preview_url}
                      alt={p.title}
                      style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: 14, marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {p.category} · ${p.price} · {p.download_count} downloads
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => toggleFeatured(p)} style={{
                        padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                        background: p.is_featured ? '#fef9c3' : 'white', cursor: 'pointer', fontSize: 12,
                      }}>{p.is_featured ? '⭐ Featured' : '☆ Feature'}</button>
                      <button onClick={() => toggleActive(p)} style={{
                        padding: '4px 10px', borderRadius: 6, border: 'none',
                        background: p.is_active ? '#fee2e2' : '#d1fae5',
                        color: p.is_active ? '#991b1b' : '#065f46',
                        cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      }}>{p.is_active ? 'Ẩn' : 'Hiện'}</button>
                      <a href={`/products/${p.slug}`} target="_blank" style={{
                        padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                        background: 'white', cursor: 'pointer', fontSize: 12,
                        textDecoration: 'none', color: 'var(--text)',
                      }}>Xem →</a>
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
