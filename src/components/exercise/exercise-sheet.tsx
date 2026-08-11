'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookmarkSimple, CaretDown, Copyright } from '@phosphor-icons/react/dist/ssr';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExerciseMedia } from './exercise-media';
import { useReadyCatalog } from '@/components/app-providers';
import { loadSteps } from '@/lib/data';
import { useStore } from '@/lib/store';
import { LEVEL_LABEL } from '@/lib/program';
import type { Exercise } from '@/lib/types';

export function ExerciseSheet({
  exercise,
  onClose,
  action,
}: {
  exercise: Exercise | null;
  onClose: () => void;
  action?: React.ReactNode;
}) {
  const { meta } = useReadyCatalog();
  const saved = useStore((s) => (exercise ? s.saved.includes(exercise.id) : false));
  const toggleSaved = useStore((s) => s.toggleSaved);
  const [steps, setSteps] = useState<string[] | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Opening a different exercise resets the sheet during render, so the new
  // exercise never shows the previous one's steps for a frame.
  const [shownId, setShownId] = useState(exercise?.id);
  if (exercise && shownId !== exercise.id) {
    setShownId(exercise.id);
    setShowOriginal(false);
    setSteps(null);
  }

  useEffect(() => {
    if (!exercise) return;
    let alive = true;
    loadSteps().then((all) => {
      if (alive) setSteps(all[exercise.id] ?? []);
    });
    return () => {
      alive = false;
    };
  }, [exercise]);

  const pattern = exercise ? meta.patterns[exercise.pat] ?? meta.patterns.general : null;
  const equipment = exercise
    ? meta.equipment.find((e) => e.key === exercise.eq)?.he ?? exercise.eq
    : '';

  return (
    <Sheet open={Boolean(exercise)} onClose={onClose} full>
      {exercise && (
        <div className="flex flex-col gap-5 pb-4">
          <div className="relative -mx-5 -mt-2">
            <ExerciseMedia
              exercise={exercise}
              animate
              className="mx-auto aspect-square w-full max-w-[320px] rounded-[var(--radius-card)]"
              sizes="320px"
            />
            <button
              type="button"
              aria-label={saved ? 'הסרה מהשמורים' : 'שמירה'}
              aria-pressed={saved}
              onClick={() => toggleSaved(exercise.id)}
              className={`absolute end-6 top-2 grid size-10 place-items-center rounded-full ${
                saved ? 'bg-accent text-accent-ink' : 'media-chip'
              }`}
            >
              <BookmarkSimple size={17} weight={saved ? 'fill' : 'bold'} />
            </button>
          </div>

          <div>
            <h2 className="text-[22px] leading-tight">{exercise.he}</h2>
            <p className="mt-1 text-[13px] text-faint" dir="ltr">
              {exercise.en}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <Fact label="שריר מטרה" value={meta.targets[exercise.tg] ?? exercise.tg} />
            <Fact label="ציוד" value={equipment} />
            <Fact label="קבוצת שרירים" value={meta.muscles[exercise.mg] ?? exercise.mg} />
            <Fact label="רמה" value={LEVEL_LABEL[exercise.lvl]} />
          </dl>

          {exercise.sec.length > 0 && (
            <section>
              <h3 className="mb-2 text-[15px]">שרירים משניים</h3>
              <ul className="flex flex-wrap gap-1.5">
                {exercise.sec.map((muscle) => (
                  <li
                    key={muscle}
                    className="rounded-full border border-line bg-surface-2 px-3 py-1 text-[13px] text-muted"
                  >
                    {meta.muscles[muscle] ?? muscle}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pattern && (
            <section>
              <h3 className="mb-2 text-[15px]">איך מבצעים נכון</h3>
              <ol className="flex flex-col gap-2.5">
                {pattern.cues.map((cue, i) => (
                  <li key={cue} className="flex gap-3">
                    <span className="digits mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent-wash text-[12px] font-bold text-accent">
                      {i + 1}
                    </span>
                    <span className="text-[14px] leading-relaxed text-muted">{cue}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              aria-expanded={showOriginal}
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-field)] border border-line bg-surface-2 px-4 py-3 text-start"
            >
              <span className="text-[14px] font-semibold">
                ההוראות המקוריות של התרגיל
                <span className="ms-1.5 text-[12px] font-normal text-faint">באנגלית</span>
              </span>
              <motion.span animate={{ rotate: showOriginal ? 180 : 0 }} className="text-muted">
                <CaretDown size={16} weight="bold" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {showOriginal && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <ol dir="ltr" className="flex flex-col gap-2 px-1 pt-3 text-start">
                    {(steps ?? []).map((step, i) => (
                      <li key={i} className="text-[13px] leading-relaxed text-muted">
                        {i + 1}. {step}
                      </li>
                    ))}
                    {steps === null && <li className="text-[13px] text-faint">טוען...</li>}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <p className="flex items-center gap-1.5 text-[11px] text-faint">
            <Copyright size={13} />
            <span dir="ltr">Gym visual - https://gymvisual.com/</span>
          </p>

          {action && <div className="sticky bottom-0 -mx-1 bg-bg-elev pt-2">{action}</div>}
        </div>
      )}
    </Sheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-field)] border border-line bg-surface-2 px-3.5 py-2.5">
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className="mt-0.5 truncate text-[14px] font-semibold">{value}</dd>
    </div>
  );
}

export { Button as SheetButton };
