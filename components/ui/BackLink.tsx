import { memo } from 'react';
import Link from 'next/link';

interface BackLinkProps {
  href: string;
  label: string;
}

export const BackLink = memo(function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link href={href} className="group flex items-center gap-2 text-primary font-bold text-sm w-fit mb-8">
      <span className="material-symbols-outlined select-none rotate-180 text-[18px]">arrow_back</span>
      <span className="group-hover:underline">{label}</span>
    </Link>
  );
});
BackLink.displayName = 'BackLink';
