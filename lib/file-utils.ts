import type { SupabaseClient } from '@supabase/supabase-js'

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

export function extractFileName(filePath: string): string | undefined {
  return filePath.split('/').pop()?.split('?')[0]
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
        if (process.env.NODE_ENV !== 'production') console.error(`Failed to list files in '${bucketName}':`, listError.message);
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
        if (process.env.NODE_ENV !== 'production') console.error(`Failed to delete files from '${bucketName}':`, removeError.message);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(`Error clearing bucket '${bucketName}':`, err);
  }
}
