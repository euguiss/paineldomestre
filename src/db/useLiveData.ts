import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';

/**
 * Subscribe to a Dexie liveQuery and re-render when the underlying data
 * changes. Returns `undefined` until the first result arrives.
 */
export function useLiveData<T>(querier: () => Promise<T>, deps: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    const sub = liveQuery(querier).subscribe({
      next: (v) => setValue(v),
      error: (err) => console.error('liveQuery error', err),
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
