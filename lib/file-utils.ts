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
