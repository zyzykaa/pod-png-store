import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

// Client cho browser (anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client cho server (service role)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function createDownloadSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('designs')
    .createSignedUrl(filePath, 3600)
  if (error || !data?.signedUrl) {
    throw new Error(`Khong the tao download URL: ${error?.message}`)
  }
  return data.signedUrl
}

export async function uploadDesignFile(
  file: File | Buffer,
  path: string,
  contentType = 'application/zip'
): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from('designs')
    .upload(path, file, { contentType, upsert: true })
  if (error) throw new Error(`Upload that bai: ${error.message}`)
  return path
}

export async function uploadPreviewImage(
  file: File | Buffer,
  path: string
): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from('previews')
    .upload(path, file, { contentType: 'image/png', upsert: true })
  if (error) throw new Error(`Upload preview that bai: ${error.message}`)
  const { data } = supabaseAdmin.storage.from('previews').getPublicUrl(path)
  return data.publicUrl
}
