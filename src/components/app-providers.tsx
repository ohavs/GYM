'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadIndex } from '@/lib/data';
import { useFirebaseSync, type SyncStatus } from '@/lib/sync';
import type { Exercise, Meta } from '@/lib/types';
import type { User } from '@/lib/firebase';
import { ToastProvider } from '@/components/ui/toast';
import { NavigationProvider } from '@/components/layout/navigation';
import { useLinks, type Links } from '@/lib/links';
import { OfflineReady } from '@/components/layout/offline-ready';
import { ThemeSync } from '@/components/layout/theme-sync';
import { CoachProgramSync } from '@/components/coach/coach-program-sync';

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

const AccountContext = createContext<{ user: User | null; status: SyncStatus }>({
  user: null,
  status: 'guest',
});

const LinksContext = createContext<Links>({ ready: true, asCoach: [], asTrainee: [] });

/** Every coach ↔ trainee link this account is part of, live. */
export const useLinksContext = () => useContext(LinksContext);

export const useCatalog = () => useContext(CatalogContext);
export const useAccount = () => useContext(AccountContext);

/** Convenience for screens that only render once the catalog exists. */
export function useReadyCatalog() {
  return useCatalog() as Catalog & { meta: Meta };
}

function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    exercises: Exercise[];
    meta: Meta | null;
    failed: boolean;
  }>({ exercises: [], meta: null, failed: false });
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

function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user, status } = useFirebaseSync();
  const value = useMemo(() => ({ user, status }), [user, status]);
  const links = useLinks(user?.uid ?? null);
  return (
    <AccountContext.Provider value={value}>
      <LinksContext.Provider value={links}>{children}</LinksContext.Provider>
    </AccountContext.Provider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <AccountProvider>
        <ToastProvider>
          <ThemeSync />
          <CoachProgramSync />
          <OfflineReady />
          <NavigationProvider>{children}</NavigationProvider>
        </ToastProvider>
      </AccountProvider>
    </CatalogProvider>
  );
}
