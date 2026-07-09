import { Spinner } from '@/components/ui/Spinner';

export default function StoreLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center font-tajawal bg-white">
      <div className="flex flex-col items-center">
        <Spinner className="h-10 w-10 mb-4" />
        <p className="text-on-surface-variant text-sm">جاري تحميل المتجر...</p>
      </div>
    </div>
  );
}
