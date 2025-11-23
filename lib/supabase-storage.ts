import { supabase } from './supabase';

/**
 * Uploads a file to a specified Supabase storage bucket.
 * @param file The file to upload.
 * @param bucketName The name of the storage bucket (e.g., 'activite-documents').
 * @param filePath The path where the file will be stored in the bucket (e.g., 'factures/invoice-123.pdf').
 * @returns The public URL of the uploaded file, or null if an error occurs.
 */
export async function uploadFileToSupabase(
  file: File,
  bucketName: string,
  filePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // Set to true if you want to overwrite existing files with the same path
    });

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  // Get the public URL of the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (publicUrlData) {
    return publicUrlData.publicUrl;
  }

  return null;
}

/**
 * Generates a unique file path for Supabase Storage.
 * @param folder The subfolder within the bucket (e.g., 'factures', 'liste_presence').
 * @param fileName The original file name.
 * @returns A unique path string.
 */
export function generateUniqueFilePath(folder: string, fileName: string): string {
  const timestamp = new Date().getTime();
  const uniqueId = Math.random().toString(36).substring(2, 8); // Short random string
  const fileExtension = fileName.split('.').pop();
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
  return `${folder}/${baseName}-${timestamp}-${uniqueId}.${fileExtension}`;
}