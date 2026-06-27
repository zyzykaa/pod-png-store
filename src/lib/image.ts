/**
 * Trả URL ảnh qua proxy /api/image với encode đúng cách
 * Dùng cho <img> tag trong app
 */
export function getImageUrl(url: string): string {
  if (!url) return ''
  if (url.includes('supabase.co')) {
    // encodeURIComponent để URL không bị parse sai
    return `/api/image?url=${encodeURIComponent(url)}`
  }
  return url
}

/**
 * Trả URL tuyệt đối của ảnh Supabase (KHÔNG qua proxy)
 * Dùng cho og:image, twitter:image — cần URL public absolute
 */
export function getAbsoluteImageUrl(url: string): string {
  return url || ''
}
