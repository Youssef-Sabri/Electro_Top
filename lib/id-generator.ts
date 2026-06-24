export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  let result = '';
  for (let i = 0; i < 10; i++) {
    const val = randomBytes[i];
    result += chars[val % chars.length];
  }
  return `ET-${result}`;
}
