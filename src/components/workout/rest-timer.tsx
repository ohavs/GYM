'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, SkipForward } from '@phosphor-icons/react/dist/ssr';
import { ProgressRing } from '@/components/ui/controls';
import { useNow } from '@/lib/clock';
import { mmss } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export type Rest = { endsAt: number; total: number };

/**
 * The rest timer is the one place the app interrupts the user, so it owns the
 * bottom of the screen while it runs and leaves the moment rest is over.
 * The deadline lives in the parent, so the countdown survives re-renders and
 * stays correct if the screen is backgrounded mid-rest.
 */
export function RestTimer({
  rest,
  nextLabel,
  onExtend,
  onDone,
}: {
  rest: Rest | null;
  nextLabel: string;
  onExtend: () => void;
  onDone: () => void;
}) {
  const now = useNow(250);
  const left = rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;
  const finished = Boolean(rest) && left === 0;

  useEffect(() => {
    if (!finished) return;
    haptic('success');
    onDone();
  }, [finished, onDone]);

  return (
    <AnimatePresence>
      {rest && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="overflow-hidden border-b border-line-soft bg-ok-wash"
        >
          <div className="mx-auto flex w-full max-w-[560px] items-center gap-3 px-4 py-3">
            <ProgressRing progress={rest.total ? left / rest.total : 0} size={56} stroke={6} tone="ok">
              <span className="digits text-[12px] font-bold">{mmss(left)}</span>
            </ProgressRing>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">מנוחה</p>
              <p className="truncate text-[13px] text-muted">הבא בתור: {nextLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic('tap');
                onExtend();
              }}
              className="flex h-10 items-center gap-1 rounded-full border border-line bg-surface-2 px-3 text-[13px] font-semibold"
            >
              <Plus size={13} weight="bold" />
              <span className="num">15</span>
            </button>
            <button
              type="button"
              onClick={() => {
                haptic('tap');
                onDone();
              }}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"
              aria-label="דילוג על המנוחה"
            >
              <SkipForward size={16} weight="fill" className="flip-rtl" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
