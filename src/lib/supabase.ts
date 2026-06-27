import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client cho browser (anon key - chỉ đọc products public)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client cho server (service role - full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Tạo Signed URL để download file (hết hạn sau 1 giờ)
export async function createDownloadSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('designs')
    .createSignedUrl(filePath, 3600) // 3600 giây = 1 giờ

  if (error || !data?.signedUrl) {
    throw new Error(`Không thể tạo download URL: ${error?.message}`)
  }

  return data.signedUrl
}

// Upload file design vào bucket private
export async function uploadDesignFile(
  file: File | Buffer,
  path: string,
  contentType = 'application/zip'
): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from('designs')
    .upload(path, file, { contentType, upsert: true })

  if (error) throw new Error(`Upload thất bại: ${error.message}`)
  return path
}

// Upload preview image vào bucket public
export async function uploadPreviewImage(
  file: File | Buffer,
  path: string
): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from('previews')
    .upload(path, file, { contentType: 'image/png', upsert: true })

  if (error) throw new Error(`Upload preview thất bại: ${error.message}`)

  const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(path)
  return data.publicUrl
}
