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
  wide = false,
}: {
  exercise: Exercise;
  onOpen: (exercise: Exercise) => void;
  index?: number;
  /** Full-width variant: one exercise per row, artwork given more height. */
  wide?: boolean;
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
          className={`w-full ${wide ? 'aspect-[3/1.9]' : 'aspect-[4/3.4]'}`}
        />
        <span
          className={`flex flex-col gap-1.5 p-4 ${wide ? '' : 'min-h-[84px]'}`}
        >
          <span
            className={`line-clamp-2 font-medium leading-snug ${
              wide ? 'text-[19px]' : 'text-[15px]'
            }`}
          >
            {exercise.he}
          </span>
          <span className={`mt-auto text-faint ${wide ? 'text-[13px]' : 'text-[12px]'}`}>
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
          saved ? 'bg-ink text-on-ink' : 'bg-card/85 text-ink backdrop-blur-sm'
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
 *
 * `dense` trims it for the catalogue's list layout, where the point is fitting
 * many exercises on screen at once rather than showing off one.
 */
export function ExerciseRow({
  exercise,
  detail,
  onClick,
  trailing,
  tone = 'card',
  dense = false,
}: {
  exercise: Exercise;
  detail?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  tone?: 'card' | 'bare';
  dense?: boolean;
}) {
  const Wrapper = onClick ? motion.button : motion.div;
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
      onClick={onClick}
      className={`flex w-full items-center text-start ${
        dense ? 'gap-3 rounded-[var(--radius-sm)] p-2' : 'gap-4 rounded-[var(--radius-md)] p-3'
      } ${tone === 'card' ? 'bg-card shadow-[var(--shadow-soft)]' : ''}`}
    >
      <ExerciseMedia
        exercise={exercise}
        tint={tintFor(exercise.id)}
        className={`shrink-0 rounded-[var(--radius-xs)] ${dense ? 'size-13' : 'size-16'}`}
      />
      <span className="min-w-0 flex-1">
        <span
          className={`font-medium leading-snug ${
            dense ? 'line-clamp-1 text-[14.5px]' : 'line-clamp-2 text-[15px]'
          }`}
        >
          {exercise.he}
        </span>
        {detail && (
          <span
            className={`block truncate text-muted ${
              dense ? 'mt-0.5 text-[12px]' : 'mt-1 text-[12.5px]'
            }`}
          >
            {detail}
          </span>
        )}
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
            {eyebrow && <p className="text-[12px] font-medium text-on-art/70">{eyebrow}</p>}
            <p className="mt-0.5 line-clamp-2 text-[19px] font-semibold leading-tight text-on-art">
              {title}
            </p>
          </div>
          {action && <div className="pointer-events-auto shrink-0">{action}</div>}
        </div>
      </div>
    </motion.div>
  );
}
