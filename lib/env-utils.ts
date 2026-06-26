export function getSupportEnv() {
  return {
    whatsapp: [
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_1 || '',
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_2 || '',
    ].filter(Boolean),
    phone: [
      process.env.NEXT_PUBLIC_SUPPORT_PHONE_1 || '',
      process.env.NEXT_PUBLIC_SUPPORT_PHONE_2 || '',
    ].filter(Boolean),
    facebook: process.env.NEXT_PUBLIC_SUPPORT_FACEBOOK || '',
  }
}
