'use client';

import { useState, useEffect } from 'react';

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration detection pattern
    setHydrated(true);
  }, []);

  return hydrated;
}
