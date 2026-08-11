'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { applyTheme } from '@/lib/theme';

/**
 * Keeps <html> in step with the stored choice.
 *
 * The boot script already set the attributes before first paint; this re-runs
 * on every change, and on "לפי המכשיר" it also follows the device flipping
 * between light and dark while the app is open.
 */
export function ThemeSync() {
  const theme = useStore((s) => s.theme);
  const palette = useStore((s) => s.palette);

  useEffect(() => {
    applyTheme(theme, palette);
    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(theme, palette);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme, palette]);

  return null;
}
