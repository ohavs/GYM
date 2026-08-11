'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadIndex } from '@/lib/data';
import { useStore } from '@/lib/store';
import type { Exercise, Meta } from '@/lib/types';
import { ToastProvider } from '@/components/ui/toast';

type Catalog = {
  ready: boolean;
  failed: boolean;
  exercises: Exercise[];
  meta: Meta | null;
  byId: Map<string, Exercise>;
  retry: () => void;
};

const CatalogContext = createContext<Catalog>({
  ready: false,
  failed: false,
  exercises: [],
  meta: null,
  byId: new Map(),
  retry: () => {},
});

export const useCatalog = () => useContext(CatalogContext);

/** Convenience for screens that only render once the catalog exists. */
export function useReadyCatalog() {
  const catalog = useCatalog();
  return catalog as Catalog & { meta: Meta };
}

function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ exercises: Exercise[]; meta: Meta | null; failed: boolean }>({
    exercises: [],
    meta: null,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    loadIndex()
      .then(({ exercises, meta }) => {
        if (alive) setState({ exercises, meta, failed: false });
      })
      .catch(() => {
        if (alive) setState((s) => ({ ...s, failed: true }));
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const value = useMemo<Catalog>(
    () => ({
      ready: Boolean(state.meta),
      failed: state.failed,
      exercises: state.exercises,
      meta: state.meta,
      byId: new Map(state.exercises.map((ex) => [ex.id, ex])),
      retry: () => setAttempt((n) => n + 1),
    }),
    [state],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

/** Keeps the document theme attribute in sync with the stored preference. */
function ThemeSync() {
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <ThemeSync />
      <ToastProvider>{children}</ToastProvider>
    </CatalogProvider>
  );
}
