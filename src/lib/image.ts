/**
 * Trả về URL ảnh qua proxy để tránh CORS/cache issues với Supabase
 * Dùng ở mọi chỗ render <img src> từ Supabase
 */
export function getImageUrl(url: string): string {
  if (!url) return ''
  if (url.includes('supabase.co')) {
    return `/api/image?url=${encodeURIComponent(url)}`
  }
  return url
}
