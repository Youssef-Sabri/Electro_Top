'use client';

import { memo } from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls = memo(function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center border-t border-outline-variant/30 select-none">
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        الصفحة {currentPage} من {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 border border-outline-variant rounded transition-all duration-200 flex items-center bg-white ${
            currentPage === 1
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-white hover:text-primary cursor-pointer'
          }`}
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 border border-outline-variant rounded transition-all duration-200 flex items-center bg-white ${
            currentPage === totalPages
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-white hover:text-primary cursor-pointer'
          }`}
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
      </div>
    </div>
  );
});
