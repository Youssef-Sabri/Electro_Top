export function generateOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  let result = '';
  for (let i = 0; i < 10; i++) {
    // Rejection sampling to avoid modulo bias (256 / 31 = 8 remainder)
    let val = randomBytes[i];
    while (val >= 248) {
      const refresh = new Uint8Array(1);
      crypto.getRandomValues(refresh);
      val = refresh[0];
    }
    result += chars[val % chars.length];
  }
  return `ET-${result}`;
}
