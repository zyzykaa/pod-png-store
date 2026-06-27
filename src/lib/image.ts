/**
 * Trả thẳng URL Supabase - browser load trực tiếp
 * Bucket previews là public nên browser có thể load được
 */
export function getImageUrl(url: string): string {
  return url || ''
}

/**
 * URL tuyệt đối cho og:image
 */
export function getAbsoluteImageUrl(url: string): string {
  return url || ''
}
