import type { SupabaseClient } from '@supabase/supabase-js'
import { devLog } from '@/lib/dev-log'

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Failed to read file as data URL'))
    }
    reader.onerror = () => reject(new Error('Failed to read file as data URL'))
    reader.readAsDataURL(file)
  })
}

function extractFileName(filePath: string): string | undefined {
  const raw = filePath.split('/').pop()?.split('?')[0]
  return raw ? decodeURIComponent(raw) : undefined
}

export async function deleteStorageFile(
  client: SupabaseClient,
  bucket: string,
  url: string
): Promise<void> {
  const fileName = url.includes('/') ? extractFileName(url) : url;
  if (!fileName) return;
  await client.storage.from(bucket).remove([fileName]);
}

const STORAGE_LIST_LIMIT = 100;

export async function clearStorageBucket(
  client: SupabaseClient,
  bucketName: string
): Promise<void> {
  try {
    let allFiles: { name: string }[] = [];
    let offset = 0;

    while (true) {
      const { data: files, error: listError } = await client.storage
        .from(bucketName)
        .list(undefined, { limit: STORAGE_LIST_LIMIT, offset });

      if (listError) {
        devLog(`Failed to list files in '${bucketName}':`, listError.message);
        return;
      }

      if (!files || files.length === 0) break;
      allFiles = allFiles.concat(files);
      if (files.length < STORAGE_LIST_LIMIT) break;
      offset += STORAGE_LIST_LIMIT;
    }

    if (allFiles.length > 0) {
      const fileNames = allFiles.map((file) => file.name);
      const { error: removeError } = await client.storage.from(bucketName).remove(fileNames);
      if (removeError) {
        devLog(`Failed to delete files from '${bucketName}':`, removeError.message);
      }
    }
  } catch (err) {
    devLog(`Error clearing bucket '${bucketName}':`, err);
  }
}
