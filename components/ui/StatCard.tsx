import { memo } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: string;
  iconColor?: string;
}

export const StatCard = memo(function StatCard({ title, value, description, icon, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">{title}</span>
        <span className={`material-symbols-outlined text-[20px] select-none ${iconColor}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface font-mono">{value}</p>
      {description && <p className="text-[10px] text-on-surface-variant font-semibold">{description}</p>}
    </div>
  );
});
StatCard.displayName = 'StatCard';
