'use client';

import { memo } from 'react';
import type { OrderStatusHistory } from '@/types';
import { formatOrderDate } from '@/lib/utils/date';
import { translateHistoryStatus } from '@/lib/utils/status';

interface StatusHistoryTimelineProps {
  history: OrderStatusHistory[];
}

export const StatusHistoryTimeline = memo(function StatusHistoryTimeline({ history }: StatusHistoryTimelineProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-6">
      <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant mb-6 font-bold border-b border-outline-variant/10 pb-2 select-none">
        سجل الحالة
      </h3>
      
      {history.length > 0 ? (
        <div className="space-y-6 relative before:content-[''] before:absolute before:right-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30 pr-1 text-start max-h-[260px] overflow-y-auto pl-2">
          {history.map((h, idx) => {
            const logDate = formatOrderDate(h.created_at);
            const logTime = new Date(h.created_at).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={h.id} className="relative pr-8">
                <div
                  className={`absolute right-0 top-1.5 w-[16px] h-[16px] rounded-full border-4 border-surface shadow-sm ${
                    idx === 0 ? 'bg-primary' : 'bg-secondary-fixed-dim'
                  }`}
                ></div>
                <p className="font-label-md text-label-md text-on-surface font-semibold">
                  {translateHistoryStatus(h.status)}
                </p>
                <p className="font-body-md text-label-sm text-on-surface-variant mt-0.5">
                  {logDate} - {logTime}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant italic">لم يتم تسجيل أي تحديثات للحالة بعد.</p>
      )}
    </div>
  );
});
