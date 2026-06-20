import { memo } from 'react';
import { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'Pending Review':
      return (
        <span className="px-3 py-1 rounded-full bg-[#f9e37f]/10 text-[#746408] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[#f9e37f]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15]"></span> قيد المراجعة
        </span>
      );
    case 'Accepted':
      return (
        <span className="px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[#3B82F6]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span> مقبول
        </span>
      );
    case 'Processing':
      return (
        <span className="px-3 py-1 rounded-full bg-[#A855F7]/10 text-[#A855F7] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[#A855F7]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span> قيد التحضير
        </span>
      );
    case 'Delivered':
      return (
        <span className="px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[#22C55E]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> تم التوصيل
        </span>
      );
    case 'Declined':
      return (
        <span className="px-3 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[#EF4444]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span> مرفوض
        </span>
      );
    case 'Check Internal Note':
      return (
        <span className="px-3 py-1 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] font-label-sm text-label-sm inline-flex items-center gap-1 border border-[#14B8A6]/30 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]"></span> قيد الفحص
        </span>
      );
    default:
      return (
        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-label-sm text-label-sm inline-flex items-center gap-1 border border-gray-200 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> {status}
        </span>
      );
  }
});
