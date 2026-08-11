'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowsClockwise,
  Barbell,
  CaretDown,
  ChatCircleText,
  Clock,
  Play,
} from '@phosphor-icons/react/dist/ssr';
import { Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { ExerciseRow } from '@/components/exercise/exercise-card';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { buildProgram, GOAL_LABEL, LEVEL_LABEL, PLACE_LABEL, weeklyMuscleSplit } from '@/lib/program';
import { estimateMinutes } from '@/lib/session';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';
import type { Exercise } from '@/lib/types';

export default function ProgramPage() {
  const router = useRouter();
  const toast = useToast();
  const { byId, exercises, meta } = useReadyCatalog();
  const program = useStore((s) => s.program);
  const profile = useStore((s) => s.profile);
  const setProgram = useStore((s) => s.setProgram);
  const startWorkout = useStore((s) => s.startWorkout);

  const [openDay, setOpenDay] = useState<string | null>(program?.days[0]?.id ?? null);
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [rebuildOpen, setRebuildOpen] = useState(false);

  if (!program) {
    return (
      <Screen>
        <ScreenHeader title="המסלול שלי" />
        <EmptyState
          icon={<Barbell size={26} />}
          title="אין מסלול פעיל"
          body="נבנה תוכנית שבועית לפי המטרה, רמת הניסיון והציוד שזמין לכם."
          action={
            <Button
              onClick={() => {
                const next = buildProgram({ ...profile, exercises, meta });
                setProgram(next);
                toast({ text: 'המסלול נבנה', tone: 'ok' });
              }}
            >
              בניית מסלול
            </Button>
          }
        />
      </Screen>
    );
  }

  const split = weeklyMuscleSplit(program, byId, meta);
  const maxSets = Math.max(...split.map((s) => s.sets), 1);

  const rebuild = () => {
    haptic('success');
    setProgram(buildProgram({ ...profile, exercises, meta }));
    setRebuildOpen(false);
    toast({ text: 'בנינו מסלול חדש', detail: 'ההיסטוריה שלכם נשמרה', tone: 'ok' });
  };

  return (
    <Screen>
      <ScreenHeader
        title="המסלול שלי"
        subtitle={program.name}
        action={
          <IconButton label="בניית מסלול מחדש" onClick={() => setRebuildOpen(true)}>
            <ArrowsClockwise size={18} weight="bold" />
          </IconButton>
        }
      />

      {program.source === 'coach' && (
        <div className="mb-4 flex gap-3 rounded-[var(--radius-card)] border border-accent-line bg-accent-wash p-4">
          <ChatCircleText size={20} weight="fill" className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">
              מסלול שנבנה על ידי {program.coachName ?? 'המאמן שלך'}
            </p>
            {program.note && (
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{program.note}</p>
            )}
          </div>
        </div>
      )}

      <section className="card mb-5 p-4">
        <SectionTitle>נפח שבועי לפי אזור</SectionTitle>
        <ul className="flex flex-col gap-2.5">
          {split.map((row, i) => (
            <li key={row.label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[13px] text-muted">{row.label}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: row.sets / maxSets }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'right' }}
                  className="block h-full rounded-full bg-accent"
                />
              </span>
              <span className="num w-8 shrink-0 text-end text-[13px] font-bold">{row.sets}</span>
            </li>
          ))}
        </ul>
      </section>

      <SectionTitle>שבוע האימונים</SectionTitle>
      <ul className="flex flex-col gap-3">
        {program.days.map((day, dayIndex) => {
          const expanded = openDay === day.id;
          return (
            <li
              key={day.id}
              className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
            >
              <button
                type="button"
                onClick={() => {
                  haptic('select');
                  setOpenDay(expanded ? null : day.id);
                }}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 p-4 text-start"
              >
                <span className="num grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-[15px] font-bold text-muted">
                  {dayIndex + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold">{day.name}</span>
                  <span className="mt-0.5 flex items-center gap-2.5 text-[12px] text-muted">
                    <span>
                      <span className="num">{day.blocks.length}</span> תרגילים
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} weight="bold" />
                      <span className="num">{estimateMinutes(day)}</span> דק׳
                    </span>
                  </span>
                </span>
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-faint">
                  <CaretDown size={17} weight="bold" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 px-3 pb-3">
                      {day.blocks.map((blockItem) => {
                        const exercise = byId.get(blockItem.exerciseId);
                        if (!exercise) return null;
                        return (
                          <ExerciseRow
                            key={blockItem.exerciseId}
                            exercise={exercise}
                            meta={meta}
                            detail={`${blockItem.sets} סטים · ${blockItem.reps} חזרות`}
                            onClick={() => setDetail(exercise)}
                          />
                        );
                      })}
                      <Button
                        block
                        className="mt-1"
                        onClick={() => {
                          haptic('heavy');
                          startWorkout(program, day.id, byId);
                          router.push('/workout');
                        }}
                      >
                        <Play size={17} weight="fill" />
                        התחילו את {day.name}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      <ExerciseSheet exercise={detail} onClose={() => setDetail(null)} />

      <Sheet
        open={rebuildOpen}
        onClose={() => setRebuildOpen(false)}
        title="לבנות מסלול מחדש?"
        subtitle="נשתמש בהגדרות הנוכחיות שלכם"
        footer={
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => setRebuildOpen(false)}>
              ביטול
            </Button>
            <Button className="flex-1" onClick={rebuild}>
              בנו מחדש
            </Button>
          </div>
        }
      >
        <dl className="flex flex-col gap-2 py-2">
          <SettingRow label="מטרה" value={GOAL_LABEL[profile.goal]} />
          <SettingRow label="רמה" value={LEVEL_LABEL[profile.level]} />
          <SettingRow label="אימונים בשבוע" value={String(profile.days)} />
          <SettingRow label="ציוד" value={PLACE_LABEL[profile.place]} />
        </dl>
        <p className="pb-2 pt-1 text-[13px] leading-relaxed text-muted">
          כדי לשנות את ההגדרות עברו לפרופיל. ההיסטוריה והתרגילים השמורים לא ייפגעו.
        </p>
      </Sheet>
    </Screen>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-field)] bg-surface-2 px-4 py-2.5">
      <dt className="text-[14px] text-muted">{label}</dt>
      <dd className="text-[14px] font-semibold">{value}</dd>
    </div>
  );
}
