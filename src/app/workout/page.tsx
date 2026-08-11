'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowsClockwise, CaretLeft, CaretRight, Info, X } from '@phosphor-icons/react/dist/ssr';
import { Button, IconButton } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Pill, tintFor } from '@/components/ui/controls';
import { ExerciseMedia } from '@/components/exercise/exercise-media';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { ExerciseRow } from '@/components/exercise/exercise-card';
import { SetList } from '@/components/workout/set-list';
import { RestTimer, type Rest } from '@/components/workout/rest-timer';
import { WorkoutSummary } from '@/components/workout/summary';
import { useCatalog } from '@/components/app-providers';
import { useHydrated, useStore } from '@/lib/store';
import { alternativesFor } from '@/lib/program';
import { mmss } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/components/ui/toast';
import type { WorkoutLog } from '@/lib/types';

export default function WorkoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { ready, byId, exercises, meta } = useCatalog();
  const toast = useToast();

  const active = useStore((s) => s.active);
  const program = useStore((s) => s.program);
  const place = useStore((s) => s.profile.place);
  const updateSet = useStore((s) => s.updateSet);
  const addSet = useStore((s) => s.addSet);
  const removeSet = useStore((s) => s.removeSet);
  const swapExercise = useStore((s) => s.swapExercise);
  const setActiveIndex = useStore((s) => s.setActiveIndex);
  const finishWorkout = useStore((s) => s.finishWorkout);
  const cancelWorkout = useStore((s) => s.cancelWorkout);

  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState<Rest | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [summary, setSummary] = useState<WorkoutLog | null>(null);
  const [openSet, setOpenSet] = useState(0);

  useEffect(() => {
    if (hydrated && !active && !summary) router.replace('/');
  }, [hydrated, active, summary, router]);

  useEffect(() => {
    if (!active) return;
    const tick = () => setElapsed(Date.now() - active.startedAt);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  const day = useMemo(
    () => program?.days.find((d) => d.id === active?.dayId) ?? null,
    [program, active],
  );

  if (!hydrated || !ready || !meta) return null;
  if (summary) return <WorkoutSummary log={summary} onClose={() => router.replace('/')} />;
  if (!active || !day) return null;

  const index = Math.min(active.index, active.entries.length - 1);
  const entry = active.entries[index];
  const block = day.blocks[index];
  const exercise = byId.get(entry.exerciseId);
  const nextExercise = byId.get(active.entries[index + 1]?.exerciseId ?? '');
  if (!exercise) return null;

  const doneSets = entry.sets.filter((s) => s.done).length;
  const totalDone = active.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalSets = active.entries.reduce((n, e) => n + e.sets.length, 0);

  const completeSet = (setIndex: number) => {
    const set = entry.sets[setIndex];
    updateSet(index, setIndex, { done: !set.done });
    if (set.done) {
      // Reopening a finished set: leave it open so it can be corrected.
      setOpenSet(setIndex);
      return;
    }
    haptic('success');
    const nextUnfinished = entry.sets.findIndex((s, i) => i !== setIndex && !s.done);
    setOpenSet(nextUnfinished === -1 ? setIndex : nextUnfinished);
    const lastOfWorkout =
      setIndex === entry.sets.length - 1 && index === active.entries.length - 1;
    setRest(lastOfWorkout ? null : { endsAt: Date.now() + block.rest * 1000, total: block.rest });
  };

  const move = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= active.entries.length) return;
    haptic('select');
    setRest(null);
    setOpenSet(Math.max(0, active.entries[next].sets.findIndex((s) => !s.done)));
    setActiveIndex(next);
  };

  const finish = () => {
    const log = finishWorkout();
    if (!log) {
      toast({ text: 'לא סימנתם אף סט', detail: 'האימון נסגר בלי להישמר', tone: 'warn' });
      router.replace('/');
      return;
    }
    haptic('success');
    setSummary(log);
  };

  const alternatives = swapOpen ? alternativesFor(exercise, exercises, place, meta) : [];

  return (
    <div className="min-h-[100dvh] bg-canvas safe-t">
      <div className="mx-auto w-full max-w-[520px] px-5 pb-52">
        <header className="flex items-center gap-3 pt-4 pb-5">
          <IconButton label="יציאה מהאימון" onClick={() => setConfirmExit(true)}>
            <X size={19} weight="bold" />
          </IconButton>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[15px] font-medium">{day.name}</p>
            <p className="digits text-[13px] text-muted">{mmss(elapsed / 1000)}</p>
          </div>
          <Button size="sm" variant="card" onClick={finish}>
            סיום
          </Button>
        </header>

        <div className="mb-6 flex gap-1.5">
          {active.entries.map((e, i) => {
            const complete = e.sets.every((s) => s.done);
            return (
              <button
                key={`${e.exerciseId}-${i}`}
                type="button"
                aria-label={`תרגיל ${i + 1}`}
                onClick={() => {
                  haptic('select');
                  setActiveIndex(i);
                }}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  complete ? 'bg-green' : i === index ? 'bg-ink' : 'bg-line-strong'
                }`}
              />
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${exercise.id}-${index}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <ExerciseMedia
                exercise={exercise}
                animate
                tint={tintFor(exercise.id)}
                className="aspect-[3/2.3] w-full rounded-[var(--radius-lg)]"
              />
              <div className="pointer-events-none absolute start-4 top-4 flex gap-2">
                <Pill>
                  <span className="digits">
                    {index + 1}/{active.entries.length}
                  </span>
                </Pill>
                <Pill>{meta.targets[exercise.tg] ?? exercise.tg}</Pill>
              </div>
              <div className="absolute end-4 top-4">
                <IconButton label="פרטי התרגיל" size="sm" onClick={() => setInfoOpen(true)}>
                  <Info size={17} weight="bold" />
                </IconButton>
              </div>
            </div>

            <div className="mt-5">
              <h1 className="text-[26px] leading-[1.1]">{exercise.he}</h1>
              <p className="num mt-2 text-[14px] text-muted">
                {block.sets} סטים · {block.reps} חזרות · מנוחה {block.rest} שניות
              </p>
            </div>

            <div className="mt-7">
              <SetList
                sets={entry.sets}
                block={block}
                activeIndex={openSet}
                onActivate={setOpenSet}
                onUpdate={(setIndex, patch) => updateSet(index, setIndex, patch)}
                onComplete={completeSet}
                onAdd={() => {
                  addSet(index);
                  setOpenSet(entry.sets.length);
                }}
                onRemove={() => {
                  removeSet(index);
                  setOpenSet((v) => Math.min(v, entry.sets.length - 2));
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setSwapOpen(true)}
              className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-full text-[14px] font-medium text-muted"
            >
              <ArrowsClockwise size={15} weight="bold" />
              החלפת התרגיל
            </button>
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Rest timer stacks above the navigation, never on top of it. */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-5 pb-[max(env(safe-area-inset-bottom),14px)]">
        <RestTimer
          rest={rest}
          onExtend={() =>
            setRest((current) =>
              current ? { endsAt: current.endsAt + 15_000, total: current.total + 15 } : current,
            )
          }
          nextLabel={
            doneSets < entry.sets.length
              ? `סט ${doneSets + 1}`
              : (nextExercise?.he ?? 'סיום האימון')
          }
          onDone={() => setRest(null)}
        />
        <div className="mx-auto mt-2.5 flex w-full max-w-[520px] items-center gap-3 rounded-full bg-card p-2.5 shadow-[var(--shadow-dock)]">
          <IconButton
            label="התרגיל הקודם"
            tone="bare"
            onClick={() => move(-1)}
            disabled={index === 0}
            className="bg-canvas"
          >
            <CaretRight size={19} weight="bold" />
          </IconButton>
          <div className="min-w-0 flex-1 text-center">
            <p className="digits text-[15px] font-semibold">
              {totalDone}/{totalSets}
            </p>
            <p className="truncate text-[12px] text-muted">
              {doneSets === entry.sets.length ? 'התרגיל הושלם' : 'סטים שהושלמו'}
            </p>
          </div>
          {index === active.entries.length - 1 ? (
            <Button size="sm" onClick={finish}>
              סיימו אימון
            </Button>
          ) : (
            <IconButton label="התרגיל הבא" onClick={() => move(1)} tone="ink">
              <CaretLeft size={19} weight="bold" />
            </IconButton>
          )}
        </div>
      </div>

      <Sheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        title="החלפת תרגיל"
        subtitle="חלופות לאותו שריר עם הציוד שיש לכם"
      >
        <ul className="flex flex-col gap-2.5 py-2">
          {alternatives.map((alt) => (
            <li key={alt.id}>
              <ExerciseRow
                exercise={alt}
                detail={meta.targets[alt.tg] ?? alt.tg}
                onClick={() => {
                  swapExercise(index, alt.id);
                  setSwapOpen(false);
                  toast({ text: 'התרגיל הוחלף', detail: alt.he, tone: 'ok' });
                }}
              />
            </li>
          ))}
        </ul>
      </Sheet>

      <ExerciseSheet exercise={infoOpen ? exercise : null} onClose={() => setInfoOpen(false)} />

      <Sheet
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        title="לצאת מהאימון?"
        subtitle="הסטים שסימנתם יישמרו אם תסיימו במקום לבטל"
        footer={
          <div className="flex flex-col gap-2.5">
            <Button
              block
              size="lg"
              onClick={() => {
                setConfirmExit(false);
                finish();
              }}
            >
              סיימו ושמרו
            </Button>
            <Button block size="lg" variant="danger" onClick={() => {
              cancelWorkout();
              router.replace('/');
            }}>
              ביטול האימון
            </Button>
            <Button block variant="quiet" onClick={() => setConfirmExit(false)}>
              חזרה לאימון
            </Button>
          </div>
        }
      >
        <p className="num px-1 py-2 text-[15px] leading-relaxed text-muted">
          השלמתם <span className="font-semibold text-ink">{totalDone}</span> סטים מתוך {totalSets}{' '}
          באימון הזה.
        </p>
      </Sheet>
    </div>
  );
}
