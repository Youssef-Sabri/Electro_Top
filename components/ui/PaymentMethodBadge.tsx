import { memo } from 'react';

interface PaymentMethodBadgeProps {
  method: string;
}

export const PaymentMethodBadge = memo(function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  if (method === 'cod') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
        <span className="material-symbols-outlined text-[12px]">payments</span>
        COD
      </span>
    );
  }
  if (method === 'instapay') {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
        <span className="material-symbols-outlined text-[12px]">account_balance_wallet</span>
        InstaPay
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
      غير محدد
    </span>
  );
});
PaymentMethodBadge.displayName = 'PaymentMethodBadge';
