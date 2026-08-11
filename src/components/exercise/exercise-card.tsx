'use client';

import { motion } from 'motion/react';
import { BookmarkSimple } from '@phosphor-icons/react/dist/ssr';
import { ExerciseMedia } from './exercise-media';
import { useReadyCatalog } from '@/components/app-providers';
import { tintFor } from '@/components/ui/controls';
import { useStore } from '@/lib/store';
import { haptic } from '@/lib/haptics';
import type { Exercise } from '@/lib/types';

/**
 * Library tile. The artwork gets most of the height, the label a calm strip
 * beneath it, and everything else floats on the art as small pills.
 */
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.42,
        delay: Math.min(index, 8) * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative"
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 460, damping: 30 }}
        onClick={() => onOpen(exercise)}
        className="flex w-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-card text-start shadow-[var(--shadow-soft)]"
      >
        <ExerciseMedia
          exercise={exercise}
          tint={tintFor(exercise.id)}
          className="aspect-[4/3.4] w-full"
        />
        <span className="flex min-h-[84px] flex-col gap-1.5 p-4">
          <span className="line-clamp-2 text-[15px] font-medium leading-snug">
            {exercise.he}
          </span>
          <span className="mt-auto text-[12px] text-faint">
            {target} · {equipment}
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
        className={`absolute end-3 top-3 grid size-9 place-items-center rounded-full transition-colors ${
          saved ? 'bg-ink text-white' : 'bg-card/85 text-ink backdrop-blur-sm'
        }`}
      >
        <BookmarkSimple size={15} weight={saved ? 'fill' : 'regular'} />
      </button>
    </motion.div>
  );
}

/**
 * Chunky list row. Big square artwork tile on the leading edge, the value or
 * control on the trailing edge, which is the mockup's workout-list rhythm.
 */
export function ExerciseRow({
  exercise,
  detail,
  onClick,
  trailing,
  tone = 'card',
}: {
  exercise: Exercise;
  detail?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  tone?: 'card' | 'bare';
}) {
  const Wrapper = onClick ? motion.button : motion.div;
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-[var(--radius-md)] p-3 text-start ${
        tone === 'card' ? 'bg-card shadow-[var(--shadow-soft)]' : ''
      }`}
    >
      <ExerciseMedia
        exercise={exercise}
        tint={tintFor(exercise.id)}
        className="size-16 shrink-0 rounded-[var(--radius-sm)]"
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[15px] font-medium leading-snug">{exercise.he}</span>
        {detail && <span className="mt-1 block truncate text-[12.5px] text-muted">{detail}</span>}
      </span>
      {trailing}
    </Wrapper>
  );
}

/** Reusable "focus" hero: big artwork on a tint with floating pills. */
export function ExerciseHero({
  exercise,
  eyebrow,
  title,
  pills,
  action,
  tint,
  onClick,
}: {
  exercise: Exercise;
  eyebrow?: string;
  title: string;
  pills?: React.ReactNode;
  action?: React.ReactNode;
  tint?: ReturnType<typeof tintFor>;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 440, damping: 30 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`relative overflow-hidden rounded-[var(--radius-lg)] ${
        tint ? '' : ''
      }`}
    >
      <ExerciseMedia
        exercise={exercise}
        tint={tint ?? tintFor(exercise.id)}
        className="aspect-[3/2.1] w-full"
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
        <div className="flex flex-wrap items-start gap-2">{pills}</div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="text-[12px] font-medium text-ink/55">{eyebrow}</p>}
            <p className="mt-0.5 line-clamp-2 text-[19px] font-semibold leading-tight text-ink">
              {title}
            </p>
          </div>
          {action && <div className="pointer-events-auto shrink-0">{action}</div>}
        </div>
      </div>
    </motion.div>
  );
}
