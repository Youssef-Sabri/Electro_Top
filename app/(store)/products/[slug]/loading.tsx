export default function ProductLoading() {
  return (
    <div className="min-h-[70vh] bg-white font-tajawal text-on-surface animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="bg-neutral-50/80 border-b border-neutral-200/50">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-2 flex items-center gap-2">
          <div className="h-3.5 w-14 bg-neutral-200/80 rounded" />
          <span className="material-symbols-outlined text-[12px] text-neutral-300">chevron_left</span>
          <div className="h-3.5 w-14 bg-neutral-200/80 rounded" />
          <span className="material-symbols-outlined text-[12px] text-neutral-300">chevron_left</span>
          <div className="h-3.5 w-24 bg-neutral-200/80 rounded" />
        </div>
      </div>

      {/* Main Product Layout Skeleton */}
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left: Product Gallery Image Skeleton */}
          <div className="flex flex-col gap-4">
            <div className="aspect-square w-full bg-neutral-100/90 rounded-2xl border border-neutral-200/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-neutral-200 select-none">image</span>
            </div>
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-neutral-100/90 rounded-xl border border-neutral-200/40" />
              <div className="w-20 h-20 bg-neutral-100/90 rounded-xl border border-neutral-200/40" />
              <div className="w-20 h-20 bg-neutral-100/90 rounded-xl border border-neutral-200/40" />
            </div>
          </div>

          {/* Right: Product Details Skeleton */}
          <div className="flex flex-col">
            {/* Category badge */}
            <div className="h-6 w-24 bg-neutral-100 rounded-full mb-4 border border-neutral-200/40" />

            {/* Title */}
            <div className="h-8 w-3/4 bg-neutral-200/80 rounded-lg mb-2" />
            <div className="h-8 w-1/2 bg-neutral-200/80 rounded-lg mb-4" />

            {/* Price */}
            <div className="h-9 w-36 bg-neutral-200/80 rounded-lg mb-6" />

            {/* Description */}
            <div className="mb-6 space-y-2.5">
              <div className="h-4 w-16 bg-neutral-200/80 rounded mb-3" />
              <div className="h-3.5 w-full bg-neutral-100/80 rounded" />
              <div className="h-3.5 w-11/12 bg-neutral-100/80 rounded" />
              <div className="h-3.5 w-3/4 bg-neutral-100/80 rounded" />
            </div>

            {/* Actions (Quantity + Add to Cart) */}
            <div className="mt-auto pt-6 border-t border-neutral-100 space-y-4">
              <div className="h-10 w-32 bg-neutral-100 rounded-xl" />
              <div className="h-12 w-full bg-neutral-200/80 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
