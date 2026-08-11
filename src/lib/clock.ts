'use client';

import { useSyncExternalStore } from 'react';

/**
 * The wall clock is an external mutable source, so it is read through
 * useSyncExternalStore rather than by calling Date.now() during render.
 * Values are bucketed, which keeps renders stable and makes the UI roll over
 * on its own when a day or a week ends while the app is open.
 */
function subscribe(bucketMs: number) {
  return (onChange: () => void) => {
    const id = setInterval(onChange, bucketMs);
    return () => clearInterval(id);
  };
}

const cache = new Map<number, { subscribe: (cb: () => void) => () => void; get: () => number }>();

function store(bucketMs: number) {
  let entry = cache.get(bucketMs);
  if (!entry) {
    entry = {
      subscribe: subscribe(bucketMs),
      get: () => Math.floor(Date.now() / bucketMs) * bucketMs,
    };
    cache.set(bucketMs, entry);
  }
  return entry;
}

/** Current time, rounded down to `bucketMs`. Defaults to one-minute resolution. */
export function useNow(bucketMs = 60_000) {
  const entry = store(bucketMs);
  return useSyncExternalStore(entry.subscribe, entry.get, entry.get);
}
