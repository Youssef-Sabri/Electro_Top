export default function ShopLoading() {
  return (
    <div className="min-h-[70vh] bg-white font-tajawal text-on-surface animate-pulse py-8">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Header Title Skeleton */}
        <div className="h-8 w-48 bg-neutral-200/80 rounded-lg mb-6" />

        {/* Category Pills Filter Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          <div className="h-9 w-20 bg-neutral-200/80 rounded-full shrink-0" />
          <div className="h-9 w-28 bg-neutral-100 rounded-full shrink-0" />
          <div className="h-9 w-24 bg-neutral-100 rounded-full shrink-0" />
          <div className="h-9 w-32 bg-neutral-100 rounded-full shrink-0" />
        </div>

        {/* Product Cards Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-neutral-200/50 p-4 flex flex-col justify-between h-[340px]"
            >
              <div className="w-full h-44 bg-neutral-100/90 rounded-xl mb-4 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-neutral-200 select-none">image</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-neutral-200/80 rounded" />
                <div className="h-3.5 w-1/2 bg-neutral-100 rounded" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-3">
                <div className="h-5 w-20 bg-neutral-200/80 rounded" />
                <div className="h-9 w-9 bg-neutral-200/80 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
