export const ALL_COLORS = [
  { name: 'أسود', hex: '#000000' },
  { name: 'أزرق', hex: '#2563EB' },
  { name: 'أحمر', hex: '#DC2626' },
  { name: 'أصفر', hex: '#FBBF24' },
  { name: 'أخضر/أصفر', hex: 'linear-gradient(135deg, #22C55E 50%, #EAB308 50%)' },
  { name: 'رمادي', hex: '#6B7280' },
  { name: 'أبيض', hex: '#FFFFFF' },
  { name: 'برتقالي', hex: '#EA580C' },
  { name: 'بنفسجي', hex: '#9333EA' },
  { name: 'وردي', hex: '#EC4899' },
] as const;

export function getColorHex(name: string): string {
  return ALL_COLORS.find(c => c.name === name)?.hex ?? '#000000';
}
