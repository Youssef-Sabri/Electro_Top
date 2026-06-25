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
