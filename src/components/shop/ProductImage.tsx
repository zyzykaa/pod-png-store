'use client'

interface Props {
  previewUrl: string
  title: string
}

export default function ProductImage({ previewUrl, title }: Props) {
  return (
    <div
      style={{
        background: '#f5f5f7', borderRadius: 16, overflow: 'hidden',
        marginBottom: 16, position: 'relative', aspectRatio: '1',
        userSelect: 'none',
      }}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <img
        src={previewUrl}
        alt={title}
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
      />
      {/* Overlay chặn chuột phải */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        onContextMenu={e => e.preventDefault()}
      />
      {/* Watermark */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          transform: 'rotate(-30deg)', display: 'block',
          fontSize: 20, fontWeight: 900, letterSpacing: 6,
          color: 'rgba(255,255,255,0.2)', userSelect: 'none', whiteSpace: 'nowrap',
        }}>TIKLIFE.SHOP</span>
      </div>
    </div>
  )
}
