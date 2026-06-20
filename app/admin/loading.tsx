import { Spinner } from '@/components/ui/Spinner';

export default function AdminLoading() {
  return (
    <div className="w-full py-20 text-center font-poppins text-on-surface-variant">
      <Spinner className="h-10 w-10 mx-auto mb-4" />
      <p className="text-sm">جاري التحميل...</p>
    </div>
  );
}
