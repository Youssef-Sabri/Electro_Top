'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CategoryGroup } from '@/types';
import { devLog } from '@/lib/utils/misc';

let cachedData: CategoryGroup[] | null = null;
let inFlightPromise: Promise<CategoryGroup[] | null> | null = null;

async function fetchHierarchyDeduplicated(): Promise<CategoryGroup[] | null> {
  if (cachedData) return cachedData;
  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    try {
      const res = await fetch('/api/category-hierarchy');
      if (res.ok) {
        const data = await res.json();
        cachedData = data;
        return data;
      }
      return null;
    } catch (err) {
      devLog('Failed to load category hierarchy:', err);
      return null;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

export function useCategoryHierarchy(initialHierarchy?: CategoryGroup[]) {
  const [hierarchy, setHierarchy] = useState<CategoryGroup[]>(() => {
    if (initialHierarchy && initialHierarchy.length > 0) {
      cachedData = initialHierarchy;
      return initialHierarchy;
    }
    return cachedData || [];
  });
  const [loading, setLoading] = useState(() => !initialHierarchy && !cachedData);

  const refresh = useCallback(async (bypassCache = false) => {
    if (bypassCache) {
      cachedData = null;
    }
    setLoading(true);
    const data = await fetchHierarchyDeduplicated();
    if (data) {
      setHierarchy(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hierarchy.length === 0) {
      (async () => {
        await refresh();
      })();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate: marking initial load complete
      setLoading(false);
    }
  }, [refresh, hierarchy.length]);

  return { hierarchy, loading, refresh };
}
