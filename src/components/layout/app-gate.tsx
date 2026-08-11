'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { WifiSlash } from '@phosphor-icons/react/dist/ssr';
import { useCatalog } from '@/components/app-providers';
import { useHydrated, useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/controls';

/**
 * Holds a screen until the persisted state and the exercise index are both
 * available, and sends first-time users into onboarding.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.profile.onboarded);
  const { ready, failed, retry } = useCatalog();

  useEffect(() => {
    if (hydrated && !onboarded) router.replace('/welcome');
  }, [hydrated, onboarded, router]);

  if (failed) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-4 pt-16">
        <EmptyState
          icon={<WifiSlash size={26} />}
          title="לא הצלחנו לטעון את מאגר התרגילים"
          body="בדקו את החיבור לרשת ונסו שוב. שאר האפליקציה ממשיכה לעבוד מהזיכרון המקומי."
          action={
            <Button variant="secondary" onClick={retry}>
              נסו שוב
            </Button>
          }
        />
      </div>
    );
  }

  if (!hydrated || !ready || !onboarded) return <BootSkeleton />;

  return <>{children}</>;
}

function BootSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="mx-auto w-full max-w-[560px] px-4 pt-6"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-56" />
      <Skeleton className="mt-6 h-44 w-full rounded-[var(--radius-card)]" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-[var(--radius-card)]" />
        <Skeleton className="h-24 rounded-[var(--radius-card)]" />
      </div>
      <Skeleton className="mt-4 h-32 w-full rounded-[var(--radius-card)]" />
    </motion.div>
  );
}
