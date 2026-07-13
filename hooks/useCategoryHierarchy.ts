'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CategoryGroup } from '@/types';
import { devLog } from '@/lib/dev-log';

export function useCategoryHierarchy(initialHierarchy?: CategoryGroup[]) {
  const [hierarchy, setHierarchy] = useState<CategoryGroup[]>(initialHierarchy || []);
  const [loading, setLoading] = useState(!initialHierarchy);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/category-hierarchy');
      if (res.ok) {
        const data = await res.json();
        setHierarchy(data);
      }
    } catch (err) {
      devLog('Failed to load category hierarchy:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  return { hierarchy, loading, refresh };
}
