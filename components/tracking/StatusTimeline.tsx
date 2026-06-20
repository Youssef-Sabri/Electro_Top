'use client';

import { memo } from 'react';
import type { OrderStatus, OrderStatusHistory } from '@/types';

interface StatusTimelineProps {
  currentStatus: OrderStatus;
  statusHistory: OrderStatusHistory[];
}

const STATUS_FLOW: { status: OrderStatus; label: string; desc: string; icon: string }[] = [
  {
    status: 'Pending Review',
    label: 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©',
    desc: 'Ù†Ø­Ù† Ù†ØªØ­Ù‚Ù‚ Ù…Ù† ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¯ÙØ¹ ÙˆØ§Ù„Ø·Ù„Ø¨.',
    icon: 'hourglass_empty',
  },
  {
    status: 'Accepted',
    label: 'ØªÙ… Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ø·Ù„Ø¨',
    desc: 'ØªÙ… ØªØ£ÙƒÙŠØ¯ Ø¹Ù…Ù„ÙŠØ© Ø§Ù„ØªØ­ÙˆÙŠÙ„ ÙˆØ§Ù„Ø¯ÙØ¹ Ø¨Ù†Ø¬Ø§Ø­.',
    icon: 'check_circle',
  },
  {
    status: 'Processing',
    label: 'Ù‚ÙŠØ¯ Ø§Ù„ØªØ­Ø¶ÙŠØ± ÙˆØ§Ù„Ø´Ø­Ù†',
    desc: 'ÙŠØªÙ… Ø§Ù„Ø¢Ù† ØªØ­Ø¶ÙŠØ± ÙˆØªØºÙ„ÙŠÙ Ø´Ø­Ù†ØªÙƒ ÙˆØªØ³Ù„ÙŠÙ…Ù‡Ø§ Ù„Ù„Ù…Ù†Ø¯ÙˆØ¨.',
    icon: 'local_shipping',
  },
  {
    status: 'Delivered',
    label: 'ØªÙ… Ø§Ù„ØªÙˆØµÙŠÙ„',
    desc: 'ØªÙ… ØªØ³Ù„ÙŠÙ… Ø§Ù„Ø´Ø­Ù†Ø© ÙˆØªÙˆØµÙŠÙ„Ù‡Ø§ Ù„Ù„Ù…ÙˆÙ‚Ø¹ Ø¨Ù†Ø¬Ø§Ø­.',
    icon: 'home',
  },
];

export const StatusTimeline = memo(function StatusTimeline({ currentStatus, statusHistory }: StatusTimelineProps) {
  if (currentStatus === 'Declined') {
    const declinedEntry = statusHistory.find((h) => h.status === 'Declined');
    const declinedTime = declinedEntry
      ? new Date(declinedEntry.timestamp).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <div className="bg-red-50 border border-error/30 rounded-xl p-8 flex items-start gap-4 font-poppins text-start shadow-sm mb-12">
        <span className="material-symbols-outlined text-4xl text-error select-none shrink-0">
          cancel
        </span>
        <div className="space-y-2">
          <h3 className="text-xl font-montserrat font-extrabold text-error">
            ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            ØªÙ… Ø±ÙØ¶ Ù‡Ø°Ø§ Ø§Ù„Ø·Ù„Ø¨ Ù…Ù† Ù‚Ø¨Ù„ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹. Ø¥Ø°Ø§ ÙƒØ§Ù† Ù„Ø¯ÙŠÙƒ Ø£ÙŠ Ø§Ø³ØªÙØ³Ø§Ø± Ø¨Ø®ØµÙˆØµ Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø±Ø§Ø±ØŒ ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¯Ø¹Ù… Ø§Ù„ÙÙ†ÙŠ ÙˆØªØ²ÙˆÙŠØ¯Ù‡Ù… Ø¨Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹.
          </p>
          {declinedTime && (
            <p className="text-xs text-gray-500 font-semibold pt-1">
              ØªØ§Ø±ÙŠØ® Ø§Ù„Ø±ÙØ¶: {declinedTime}
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
    <div className="space-y-12 bg-surface-container-lowest p-8 md:p-12 rounded-xl border border-outline-variant/30 shadow-sm text-start font-poppins">
      <h2 className="font-headline-md text-headline-md mb-8 text-on-surface">Ù…Ø³Ø§Ø± Ø´Ø­Ù†ØªÙƒ</h2>
      
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
            ? new Date(historyEntry.timestamp).toLocaleDateString('ar-EG', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
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
                  {formattedTime ? formattedTime : isCurrent ? 'Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©' : 'Ø¨Ø§Ù†ØªØ¸Ø§Ø± ÙˆØµÙˆÙ„ Ø§Ù„Ø´Ø­Ù†Ø©'}
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
