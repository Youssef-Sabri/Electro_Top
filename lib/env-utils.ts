export function getSupportEnv() {
  const sanitize = (val: string) => val.replace(/[^0-9]/g, '');

  return {
    whatsapp: [
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_1,
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_2,
    ].filter((val): val is string => Boolean(val)).map(sanitize),
    phone: [
      process.env.NEXT_PUBLIC_SUPPORT_PHONE_1,
      process.env.NEXT_PUBLIC_SUPPORT_PHONE_2,
    ].filter((val): val is string => Boolean(val)),
    facebook: process.env.NEXT_PUBLIC_SUPPORT_FACEBOOK || '',
  }
}
