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

export type ColorEntry = (typeof ALL_COLORS)[number];

export function getColorHex(name: string): string {
  return ALL_COLORS.find(c => c.name === name)?.hex ?? '#000000';
}

export function isGradientColor(value: string): boolean {
  return value.startsWith('linear-gradient');
}

export interface BannerTheme {
  id: string;
  name: string;
  gradientClass: string;
  textClass: string;
  badgeClass: string;
  borderClass: string;
  glowColor: string;
  radialHighlight: string;
}

export const BANNER_THEMES: BannerTheme[] = [
  {
    id: 'gradient-primary',
    name: 'أحمر إلكترو توب (الرئيسي)',
    gradientClass: 'from-[#7a0013] via-[#a40019] to-[#c71528]',
    textClass: 'text-white',
    badgeClass: 'bg-black/35 text-amber-300 border-amber-400/40',
    borderClass: 'border-[#ca202b]/40',
    glowColor: 'rgba(202, 32, 43, 0.4)',
    radialHighlight: 'from-amber-400/15 via-red-500/10 to-transparent',
  },
  {
    id: 'gradient-gold',
    name: 'ذهبي / برتقالي',
    gradientClass: 'from-[#9a3412] via-[#ea580c] to-[#d97706]',
    textClass: 'text-white',
    badgeClass: 'bg-black/35 text-yellow-300 border-yellow-400/40',
    borderClass: 'border-amber-400/40',
    glowColor: 'rgba(234, 88, 12, 0.4)',
    radialHighlight: 'from-yellow-300/20 via-orange-500/10 to-transparent',
  },
  {
    id: 'gradient-emerald',
    name: 'زمردي / فاخر',
    gradientClass: 'from-[#064e3b] via-[#047857] to-[#0d9488]',
    textClass: 'text-white',
    badgeClass: 'bg-emerald-950/60 text-emerald-200 border-emerald-400/40',
    borderClass: 'border-emerald-400/30',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    radialHighlight: 'from-emerald-300/20 via-teal-500/10 to-transparent',
  },
  {
    id: 'gradient-blue',
    name: 'أزرق تقني',
    gradientClass: 'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]',
    textClass: 'text-white',
    badgeClass: 'bg-blue-950/60 text-blue-200 border-blue-400/40',
    borderClass: 'border-blue-400/30',
    glowColor: 'rgba(37, 99, 235, 0.4)',
    radialHighlight: 'from-cyan-300/20 via-blue-500/10 to-transparent',
  },
  {
    id: 'gradient-purple',
    name: 'أرجواني ملكي',
    gradientClass: 'from-[#581c87] via-[#7e22ce] to-[#a855f7]',
    textClass: 'text-white',
    badgeClass: 'bg-purple-950/60 text-purple-200 border-purple-400/40',
    borderClass: 'border-purple-400/30',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    radialHighlight: 'from-fuchsia-300/20 via-purple-500/10 to-transparent',
  },
  {
    id: 'gradient-dark',
    name: 'أسود كلاسيك',
    gradientClass: 'from-[#090d16] via-[#181d28] to-[#272e3f]',
    textClass: 'text-white',
    badgeClass: 'bg-zinc-800/80 text-amber-400 border-amber-400/30',
    borderClass: 'border-zinc-700/60',
    glowColor: 'rgba(251, 191, 36, 0.3)',
    radialHighlight: 'from-amber-400/15 via-zinc-600/10 to-transparent',
  },
];

export function getBannerTheme(id?: string | null): BannerTheme {
  return BANNER_THEMES.find((t) => t.id === id) || BANNER_THEMES[0];
}
