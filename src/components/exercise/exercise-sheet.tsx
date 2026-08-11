'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Barbell, BookmarkSimple, CaretDown, Crosshair, Gauge, Person } from '@phosphor-icons/react/dist/ssr';
import { Sheet } from '@/components/ui/sheet';
import { ExerciseMedia } from './exercise-media';
import { useReadyCatalog } from '@/components/app-providers';
import { Pill, TINT_BG, tintFor } from '@/components/ui/controls';
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

  // Opening a different exercise resets during render, so the new exercise
  // never shows the previous one's steps for a frame.
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

  const pattern = exercise ? (meta.patterns[exercise.pat] ?? meta.patterns.general) : null;
  const equipment = exercise
    ? (meta.equipment.find((e) => e.key === exercise.eq)?.he ?? exercise.eq)
    : '';
  const tint = exercise ? tintFor(exercise.id) : 'lilac';

  return (
    <Sheet open={Boolean(exercise)} onClose={onClose} full>
      {exercise && (
        <div className="flex flex-col gap-7 pb-6">
          <div className="relative -mt-1">
            <ExerciseMedia
              exercise={exercise}
              animate
              tint={tint}
              className="aspect-[3/2.4] w-full rounded-[var(--radius-lg)]"
            />
            <button
              type="button"
              aria-label={saved ? 'הסרה מהשמורים' : 'שמירה'}
              aria-pressed={saved}
              onClick={() => toggleSaved(exercise.id)}
              className={`absolute end-4 top-4 grid size-11 place-items-center rounded-full transition-colors ${
                saved ? 'bg-ink text-white' : 'bg-card/85 text-ink backdrop-blur-sm'
              }`}
            >
              <BookmarkSimple size={17} weight={saved ? 'fill' : 'regular'} />
            </button>
            <div className="pointer-events-none absolute bottom-4 start-4 flex gap-2">
              <Pill>{meta.targets[exercise.tg] ?? exercise.tg}</Pill>
              <Pill>{LEVEL_LABEL[exercise.lvl]}</Pill>
            </div>
          </div>

          <div>
            <h2 className="text-[27px] leading-[1.12]">{exercise.he}</h2>
            <p className="mt-2 text-[13px] text-faint" dir="ltr">
              {exercise.en}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Fact
              icon={<Crosshair size={18} weight="bold" />}
              label="שריר מטרה"
              value={meta.targets[exercise.tg] ?? exercise.tg}
              tint="mint"
            />
            <Fact
              icon={<Barbell size={18} weight="bold" />}
              label="ציוד"
              value={equipment}
              tint="peach"
            />
            <Fact
              icon={<Person size={18} weight="bold" />}
              label="קבוצת שרירים"
              value={meta.muscles[exercise.mg] ?? exercise.mg}
              tint="lilac"
            />
            <Fact
              icon={<Gauge size={18} weight="bold" />}
              label="רמה"
              value={LEVEL_LABEL[exercise.lvl]}
              tint="butter"
            />
          </dl>

          {exercise.sec.length > 0 && (
            <section>
              <h3 className="mb-3 px-1 text-[17px]">שרירים משניים</h3>
              <ul className="flex flex-wrap gap-2">
                {exercise.sec.map((muscle) => (
                  <li key={muscle}>
                    <Pill>{meta.muscles[muscle] ?? muscle}</Pill>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {pattern && (
            <section>
              <h3 className="mb-3 px-1 text-[17px]">איך מבצעים נכון</h3>
              <ol className="flex flex-col gap-2.5">
                {pattern.cues.map((cue, i) => (
                  <li
                    key={cue}
                    className="flex gap-3.5 rounded-[var(--radius-md)] bg-card p-4 shadow-[var(--shadow-soft)]"
                  >
                    <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <span className="text-[14.5px] leading-relaxed text-ink-soft">{cue}</span>
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
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] bg-card px-5 py-4 text-start shadow-[var(--shadow-soft)]"
            >
              <span className="text-[14.5px] font-medium">
                ההוראות המקוריות
                <span className="ms-1.5 text-[12.5px] font-normal text-faint">באנגלית</span>
              </span>
              <motion.span animate={{ rotate: showOriginal ? 180 : 0 }} className="text-muted">
                <CaretDown size={17} weight="bold" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {showOriginal && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <ol dir="ltr" className="flex flex-col gap-2.5 px-5 pt-4 text-start">
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

          <p className="px-1 text-[11px] text-faint" dir="ltr">
            © Gym visual - https://gymvisual.com/
          </p>

          {action && <div className="sticky bottom-0 bg-canvas pt-2">{action}</div>}
        </div>
      )}
    </Sheet>
  );
}

/**
 * A tinted block with a small caption in it reads as unfinished. Giving each
 * fact a glyph and a headline-sized value makes the tile carry real weight.
 */
function Fact({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: keyof typeof TINT_BG;
}) {
  return (
    <div className={`flex flex-col gap-4 rounded-[var(--radius-lg)] ${TINT_BG[tint]} p-5`}>
      <span className="grid size-10 place-items-center rounded-full bg-white/60">{icon}</span>
      <div>
        <dt className="text-[12px] text-ink/50">{label}</dt>
        <dd className="mt-1 text-[19px] font-medium leading-tight">{value}</dd>
      </div>
    </div>
  );
}
