import { useState, useMemo, useCallback, useEffect } from 'react';

export function usePagination<T>(items: T[], itemsPerPage: number, initialPage = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setCurrentPage((prev) => Math.min(prev, totalPages)); }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return { currentPage, setCurrentPage, totalPages, paginatedItems, resetPage };
}
