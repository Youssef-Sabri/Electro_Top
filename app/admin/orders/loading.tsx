export default function AdminOrdersLoading() {
  return (
    <div className="space-y-8 font-poppins animate-pulse p-6 text-start" dir="rtl">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
          <div className="h-4 w-96 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-md"></div>
      </div>

      {/* Search Bar Deck Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="h-10 w-full lg:max-w-xl bg-gray-200 rounded-md"></div>
          <div className="h-10 w-48 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between gap-4">
              <div className="h-6 w-24 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-36 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-28 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
