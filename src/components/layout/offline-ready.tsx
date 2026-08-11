'use client';

import { useEffect } from 'react';

/**
 * Registers the offline shell. Kept out of the render tree's way: it has no UI
 * and never blocks anything, so a browser without service workers just runs the
 * app online as before.
 */
export function OfflineReady() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // A failed registration only costs offline support, not the app.
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
