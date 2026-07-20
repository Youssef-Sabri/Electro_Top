import { memo } from 'react';
import { Spinner } from '@/components/ui/Spinner';

export default memo(function StoreLoading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center font-tajawal bg-white text-on-surface select-none">
      <div className="flex flex-col items-center">
        <Spinner className="h-9 w-9 text-primary mb-3" />
        <p className="text-xs font-bold text-on-surface-variant tracking-wide">جاري التحميل...</p>
      </div>
    </div>
  );
});
