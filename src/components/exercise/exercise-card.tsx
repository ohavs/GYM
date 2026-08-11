'use client';

import { motion } from 'motion/react';
import { BookmarkSimple } from '@phosphor-icons/react/dist/ssr';
import { ExerciseMedia } from './exercise-media';
import { useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { haptic } from '@/lib/haptics';
import type { Exercise } from '@/lib/types';
import { LEVEL_LABEL } from '@/lib/program';

export function ExerciseCard({
  exercise,
  onOpen,
  index = 0,
}: {
  exercise: Exercise;
  onOpen: (exercise: Exercise) => void;
  index?: number;
}) {
  const { meta } = useReadyCatalog();
  const saved = useStore((s) => s.saved.includes(exercise.id));
  const toggleSaved = useStore((s) => s.toggleSaved);

  const equipment = meta.equipment.find((e) => e.key === exercise.eq)?.chip ?? exercise.eq;
  const target = meta.targets[exercise.tg] ?? exercise.tg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index, 8) * 0.025, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.975 }}
        transition={{ type: 'spring', stiffness: 480, damping: 30 }}
        onClick={() => onOpen(exercise)}
        className="flex w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface text-start"
      >
        <ExerciseMedia exercise={exercise} className="aspect-square w-full" />
        <span className="flex min-h-[86px] flex-col gap-1.5 p-3">
          <span className="line-clamp-2 text-[14px] font-semibold leading-snug">
            {exercise.he}
          </span>
          <span className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-faint">
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{target}</span>
            <span>{equipment}</span>
          </span>
        </span>
      </motion.button>

      <button
        type="button"
        aria-label={saved ? 'הסרה מהשמורים' : 'שמירה'}
        aria-pressed={saved}
        onClick={() => {
          haptic('select');
          toggleSaved(exercise.id);
        }}
        className={`absolute end-2 top-2 grid size-8 place-items-center rounded-full transition-colors ${
          saved ? 'bg-accent text-accent-ink' : 'media-chip'
        }`}
      >
        <BookmarkSimple size={15} weight={saved ? 'fill' : 'bold'} />
      </button>

      {exercise.lvl === 3 && (
        <span className="media-chip pointer-events-none absolute start-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          {LEVEL_LABEL[3]}
        </span>
      )}
    </motion.div>
  );
}

/** Compact row used inside programs and the workout player. */
export function ExerciseRow({
  exercise,
  meta,
  detail,
  onClick,
  trailing,
}: {
  exercise: Exercise;
  meta: { targets: Record<string, string> };
  detail?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const Wrapper = onClick ? motion.button : motion.div;
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 480, damping: 30 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface p-2.5 text-start"
    >
      <ExerciseMedia exercise={exercise} className="size-14 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[14px] font-semibold leading-snug">{exercise.he}</span>
        <span className="mt-0.5 block truncate text-[12px] text-muted">
          {detail ?? meta.targets[exercise.tg] ?? exercise.tg}
        </span>
      </span>
      {trailing}
    </Wrapper>
  );
}
