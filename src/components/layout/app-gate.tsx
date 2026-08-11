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
      <div className="mx-auto w-full max-w-[520px] px-5 pt-16">
        <EmptyState
          icon={<WifiSlash size={30} />}
          title="לא הצלחנו לטעון את מאגר התרגילים"
          body="בדקו את החיבור לרשת ונסו שוב. שאר האפליקציה ממשיכה לעבוד מהזיכרון המקומי."
          action={
            <Button size="lg" onClick={retry}>
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
      className="mx-auto w-full max-w-[520px] px-5 pt-6"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="size-12 rounded-full" />
      </div>
      <Skeleton className="mt-7 h-9 w-52" />
      <Skeleton className="mt-3 h-5 w-36" />
      <Skeleton className="mt-7 h-18 w-full rounded-full" />
      <div className="mt-4 flex flex-col gap-2.5">
        <Skeleton className="h-20 rounded-[var(--radius-md)]" />
        <Skeleton className="h-20 rounded-[var(--radius-md)]" />
        <Skeleton className="h-20 rounded-[var(--radius-md)]" />
      </div>
      <Skeleton className="mt-4 h-52 w-full rounded-[var(--radius-lg)]" />
    </motion.div>
  );
}
