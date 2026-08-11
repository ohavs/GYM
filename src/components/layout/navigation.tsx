'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';

type Nav = {
  /** Navigate and report progress while the route's code is fetched. */
  go: (href: string, options?: { replace?: boolean }) => void;
  /** True from the tap until the new screen is on the page. */
  pending: boolean;
  /** The href being navigated to, so a specific button can show its own state. */
  target: string | null;
};

const NavContext = createContext<Nav>({ go: () => {}, pending: false, target: null });

export const useNavigation = () => useContext(NavContext);

/**
 * Route chunks are fetched on demand, so a tap can sit for a second with
 * nothing happening. Every programmatic navigation goes through here, which
 * gives the caller a pending flag and paints a progress bar across the top.
 */
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);

  // The transition ends when the new route commits. Clearing during render
  // rather than in an effect means the bar never lingers for an extra frame.
  const [committed, setCommitted] = useState(pathname);
  if (committed !== pathname) {
    setCommitted(pathname);
    setTarget(null);
  }

  const go = useCallback<Nav['go']>(
    (href, options) => {
      if (href === pathname) return;
      setTarget(href);
      startTransition(() => {
        if (options?.replace) router.replace(href);
        else router.push(href);
      });
    },
    [pathname, router],
  );

  const pending = isPending || target !== null;
  const value = useMemo<Nav>(() => ({ go, pending, target }), [go, pending, target]);

  return (
    <NavContext.Provider value={value}>
      <RouteProgress active={pending} />
      {children}
    </NavContext.Provider>
  );
}

function RouteProgress({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px] overflow-hidden"
          role="status"
          aria-label="טוען"
        >
          {/* Creeps toward the end rather than claiming a percentage it cannot
              know, then the exit fade stands in for completion. */}
          <motion.span
            className="block h-full rounded-full bg-ink"
            initial={{ width: '8%' }}
            animate={{ width: ['8%', '62%', '86%'] }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], times: [0, 0.35, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
