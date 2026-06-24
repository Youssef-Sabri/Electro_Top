export function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function getEnv(name: string, fallback: string): string {
  return process.env[name] || fallback
}

export function getSupportEnv() {
  return {
    whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '',
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '',
    facebook: process.env.NEXT_PUBLIC_SUPPORT_FACEBOOK || '',
  }
}
