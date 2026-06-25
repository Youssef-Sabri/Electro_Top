export function getSupportEnv() {
  return {
    whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '',
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '',
    facebook: process.env.NEXT_PUBLIC_SUPPORT_FACEBOOK || '',
  }
}
