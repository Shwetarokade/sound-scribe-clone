import { supabase } from './supabase.js';

/**
 * Uploads a buffer to Supabase Storage and returns the public URL.
 * @param {Buffer} buffer - The audio buffer to upload.
 * @param {string} bucket - The storage bucket name.
 * @param {string} path - The file path (including filename) in the bucket.
 * @param {string} mimetype - The MIME type of the file.
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export async function uploadBufferToSupabaseStorage(buffer, bucket, path, mimetype) {
  // Upload the file
  const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: mimetype,
    upsert: true,
  });
  if (error) {
    throw new Error('Supabase Storage upload error: ' + error.message);
  }
  // Get the public URL
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrlData.publicUrl;
}