import { memo } from 'react';
import { getColorHex } from '@/lib/utils/color';

interface ColorSwatchProps {
  color: string;
  size?: 'sm' | 'md';
}

export const ColorSwatch = memo(function ColorSwatch({ color, size = 'sm' }: ColorSwatchProps) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <span
      className={`${sizeClass} rounded-full border border-white/10 shadow-sm inline-block shrink-0`}
      style={{ background: getColorHex(color) }}
    />
  );
});
ColorSwatch.displayName = 'ColorSwatch';
