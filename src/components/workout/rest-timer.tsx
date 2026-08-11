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
 * The one place the app interrupts the user, so it takes the full width above
 * the controls and leaves the moment rest is over. The deadline lives in the
 * parent, so the countdown stays correct across re-renders and backgrounding.
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
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="overflow-hidden"
        >
          <div className="mx-auto flex w-full max-w-[520px] items-center gap-4 rounded-[var(--radius-lg)] bg-hero p-3 ps-3 pe-4 text-on-hero">
            <ProgressRing
              progress={rest.total ? left / rest.total : 0}
              size={56}
              stroke={5}
              tone="hero"
            >
              <span className="digits text-[13px] font-semibold">{mmss(left)}</span>
            </ProgressRing>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">מנוחה</p>
              <p className="truncate text-[12.5px] text-on-hero/68">הבא: {nextLabel}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic('tap');
                onExtend();
              }}
              className="flex h-10 items-center gap-1 rounded-full bg-on-hero/12 px-3.5 text-[13px] font-medium"
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
              className="grid size-10 shrink-0 place-items-center rounded-full bg-on-hero text-hero"
              aria-label="דילוג על המנוחה"
            >
              <SkipForward size={15} weight="fill" className="flip-rtl" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
