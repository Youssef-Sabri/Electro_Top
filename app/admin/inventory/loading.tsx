export default function AdminInventoryLoading() {
  return (
    <div className="space-y-8 font-poppins animate-pulse p-6 text-start" dir="rtl">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
          <div className="h-4 w-96 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-gray-200 rounded-md"></div>
          <div className="h-10 w-36 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-16 bg-gray-200 rounded-md"></div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-100"></div>
          </div>
        ))}
      </div>

      {/* Filters & Category Manager Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="h-10 w-full bg-gray-200 rounded-md"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-md"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-md"></div>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="h-10 w-full bg-gray-200 rounded-md"></div>
          <div className="h-8 w-full bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded-md"></div>
                  <div className="h-4 w-72 bg-gray-200 rounded-md"></div>
                </div>
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-16 bg-gray-200 rounded-md"></div>
              <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-20 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
