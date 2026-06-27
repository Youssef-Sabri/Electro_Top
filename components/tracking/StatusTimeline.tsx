'use client';

import { memo } from 'react';
import type { OrderStatus, OrderStatusHistory } from '@/types';
import { formatOrderTimestamp } from '@/lib/date-utils';

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory: OrderStatusHistory[];
}

const STATUS_FLOW: { status: OrderStatus; label: string; desc: string; icon: string }[] = [
  {
    status: 'Pending Review',
    label: 'قيد المراجعة',
    desc: 'نحن نتحقق من تفاصيل الدفع والطلب.',
    icon: 'hourglass_empty',
  },
  {
    status: 'Accepted',
    label: 'تم قبول الطلب',
    desc: 'تم تأكيد عملية التحويل والدفع بنجاح.',
    icon: 'check_circle',
  },
  {
    status: 'Processing',
    label: 'قيد التحضير والشحن',
    desc: 'يتم الآن تحضير وتغليف شحنتك وتسليمها للمندوب.',
    icon: 'local_shipping',
  },
  {
    status: 'Delivered',
    label: 'تم التوصيل',
    desc: 'تم تسليم الشحنة وتوصيلها للموقع بنجاح.',
    icon: 'home',
  },
];

export const StatusTimeline = memo(function StatusTimeline({ currentStatus, statusHistory }: StatusTimelineProps) {
  if (currentStatus === 'Declined') {
    const declinedEntry = statusHistory.find((h) => h.status === 'Declined');
    const declinedTime = declinedEntry
      ? new Date(declinedEntry.created_at).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <div className="bg-red-50 border border-error/30 rounded-xl p-8 flex items-start gap-4 font-tajawal text-start shadow-sm mb-12">
        <span className="material-symbols-outlined text-4xl text-error select-none shrink-0">
          cancel
        </span>
        <div className="space-y-2">
          <h3 className="text-xl font-tajawal font-extrabold text-error">
            تم رفض الطلب
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            تم رفض هذا الطلب من قبل إدارة الموقع. إذا كان لديك أي استفسار بخصوص هذا القرار، يرجى التواصل مع الدعم الفني وتزويدهم برقم التتبع.
          </p>
          {declinedTime && (
            <p className="text-xs text-gray-500 font-semibold pt-1">
              تاريخ الرفض: {declinedTime}
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.status === currentStatus);

  const progressPercent =
    currentStatusIndex === -1 ? 0 : (currentStatusIndex / (STATUS_FLOW.length - 1)) * 100;

  return (
    <div className="space-y-12 bg-surface-container-lowest p-8 md:p-12 rounded-xl border border-outline-variant/30 shadow-sm text-start font-tajawal">
      <h2 className="font-headline-md text-headline-md mb-8 text-on-surface">مسار شحنتك</h2>
      
      <div className="relative pr-12 space-y-12">
        <div className="absolute right-[19px] top-2 bottom-2 w-1 bg-outline-variant/30"></div>
        
        <div
          className="absolute right-[19px] top-2 w-1 bg-primary transition-all duration-500 ease-in-out"
          style={{ height: `calc(${progressPercent}% - 4px)` }}
        ></div>

        {STATUS_FLOW.map((step, index) => {
          const historyEntry = statusHistory.find((h) => 
            h.status === step.status || 
            (step.status === 'Pending Review' && h.status === 'Check Internal Note')
          );
          const formattedTime = historyEntry
            ? formatOrderTimestamp(historyEntry.created_at)
            : null;

          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          const isUpcoming = index > currentStatusIndex;

          return (
            <div
              key={step.status}
              className={`relative transition-opacity duration-300 ${
                isUpcoming ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <div
                className={`absolute -right-[38px] top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-surface ${
                  isCurrent
                    ? 'bg-primary pulsing-dot text-white'
                    : isCompleted
                      ? 'bg-primary text-white'
                      : 'bg-outline-variant/50 text-white'
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl select-none"
                  style={{ fontVariationSettings: isCurrent || isCompleted ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {step.icon}
                </span>
              </div>

              <div>
                <h4
                  className={`font-headline-md text-headline-md ${
                    isCurrent ? 'text-primary' : 'text-on-surface'
                  }`}
                >
                  {step.label}
                </h4>
                
                <p className="text-on-surface-variant text-body-md mt-1">
                  {formattedTime ? formattedTime : isCurrent ? 'المرحلة الحالية' : 'بانتظار وصول الشحنة'}
                </p>
                
                <p className="text-on-surface-variant font-label-sm mt-2 max-w-lg leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
