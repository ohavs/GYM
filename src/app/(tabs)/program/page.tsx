'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowsClockwise,
  Barbell,
  CaretDown,
  ChatCircleText,
  Play,
} from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { useNavigation } from '@/components/layout/navigation';
import { Button, IconButton } from '@/components/ui/button';
import { Chip, EmptyState, Pill, TINT_BG, tintFor } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { ExerciseRow } from '@/components/exercise/exercise-card';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { useExclusivePanel, usePanel, useStore } from '@/lib/store';
import {
  buildProgram,
  GOAL_LABEL,
  LEVEL_LABEL,
  PLACE_LABEL,
  weeklyMuscleSplit,
} from '@/lib/program';
import { estimateMinutes } from '@/lib/session';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';
import type { Exercise, Goal, Level, Place, Profile } from '@/lib/types';

export default function ProgramPage() {
  const nav = useNavigation();
  const toast = useToast();
  const { byId, exercises, meta } = useReadyCatalog();
  const program = useStore((s) => s.program);
  const profile = useStore((s) => s.profile);
  const setProgram = useStore((s) => s.setProgram);
  const setProfile = useStore((s) => s.setProfile);
  const startWorkout = useStore((s) => s.startWorkout);

  const [openDay, setOpenDay] = useExclusivePanel(
    'program:day',
    program?.days.map((d) => d.id) ?? [],
    program?.days[0]?.id ?? null,
  );
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  const [splitOpen, setSplitOpen] = usePanel('program:split');

  if (!program) {
    return (
      <Screen>
        <ScreenHeader title="המסלול שלי" />
        <EmptyState
          icon={<Barbell size={30} />}
          title="אין מסלול פעיל"
          body="נבנה תוכנית שבועית לפי המטרה, רמת הניסיון והציוד שזמין לכם."
          action={
            <Button
              size="lg"
              onClick={() => {
                setProgram(buildProgram({ ...profile, exercises, meta }));
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
  // Several areas can share the top spot, so the summary names all of them
  // rather than picking whichever happened to sort first.
  const busiest = split.filter((row) => row.sets === maxSets).map((row) => row.label);

  // The sheet edits a draft; committing writes it to the profile too, so the
  // settings the user just chose are the settings the app reports everywhere.
  const rebuild = (settings: TrainingSettings) => {
    haptic('success');
    setProfile(settings);
    setProgram(buildProgram({ ...profile, ...settings, exercises, meta }));
    setRebuildOpen(false);
    toast({ text: 'בנינו מסלול חדש', detail: 'ההיסטוריה שלכם נשמרה', tone: 'ok' });
  };

  return (
    <Screen>
      <ScreenHeader
        title="המסלול שלי"
        subtitle={program.name}
        action={
          <IconButton label="בניית מסלול מחדש" onClick={() => setRebuildOpen(true)} className="mt-1">
            <ArrowsClockwise size={19} weight="bold" />
          </IconButton>
        }
      />

      {program.source === 'coach' && (
        <Rise>
          <div className="mb-5 flex gap-3.5 rounded-[var(--radius-lg)] bg-butter p-5">
            <ChatCircleText size={21} weight="fill" className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[14.5px] font-medium">
                מסלול שנבנה על ידי {program.coachName ?? 'המאמן שלך'}
              </p>
              {program.note && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-on-tint/65">{program.note}</p>
              )}
            </div>
          </div>
        </Rise>
      )}

      {/* "Weekly volume by area" meant nothing to anyone who is not a coach.
          Same data, said plainly: which areas the week works, and how hard. */}
      <Rise>
        <section className="mb-7 overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-soft)]">
          <button
            type="button"
            onClick={() => {
              haptic('select');
              setSplitOpen(!splitOpen);
            }}
            aria-expanded={splitOpen}
            className="flex w-full items-start gap-3 p-6 text-start"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[18px] font-semibold">על מה עובדים השבוע</span>
              <span className="mt-1.5 block text-[13.5px] leading-relaxed text-muted">
                כמה סטים כל אזור בגוף מקבל לאורך {program.days.length} האימונים.
              </span>
            </span>
            <motion.span animate={{ rotate: splitOpen ? 180 : 0 }} className="mt-1 text-faint">
              <CaretDown size={19} weight="bold" />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {splitOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6">
          <ul className="flex flex-col gap-4">
            {split.map((row, i) => (
              <li key={row.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[14.5px] font-medium">{row.label}</span>
                  <span className="num text-[13px] text-muted">{row.sets} סטים</span>
                </div>
                <span className="block h-3 overflow-hidden rounded-full bg-canvas">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: row.sets / maxSets }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'right' }}
                    className={`block h-full rounded-full ${
                      row.sets === maxSets ? 'bg-ink' : 'bg-lilac-deep'
                    }`}
                  />
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-[13.5px] leading-relaxed text-muted">
            הכי הרבה עבודה השבוע הולכת ל
            <span className="font-medium text-ink">
              {busiest.length > 1 ? busiest.slice(0, 2).join(' ול') : busiest[0]}
            </span>
            .
          </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </Rise>

      <Rise>
        <SectionTitle>שבוע האימונים</SectionTitle>
      </Rise>

      <Rise>
        <ul className="flex flex-col gap-3.5">
          {program.days.map((day, dayIndex) => {
            const expanded = openDay === day.id;
            const tint = tintFor(day.id, dayIndex);
            return (
              <li
                key={day.id}
                className="overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-soft)]"
              >
                <button
                  type="button"
                  onClick={() => {
                    haptic('select');
                    setOpenDay(expanded ? null : day.id);
                  }}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-4 p-4 text-start"
                >
                  <span
                    className={`num grid size-13 shrink-0 place-items-center rounded-[var(--radius-sm)] ${TINT_BG[tint]} text-[17px] font-semibold`}
                  >
                    {dayIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-medium">{day.name}</span>
                    <span className="num mt-1 block text-[12.5px] text-muted">
                      {day.blocks.length} תרגילים · {estimateMinutes(day)} דק׳
                    </span>
                  </span>
                  <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-faint">
                    <CaretDown size={19} weight="bold" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2.5 px-3 pb-4">
                        {day.blocks.map((blockItem) => {
                          const exercise = byId.get(blockItem.exerciseId);
                          if (!exercise) return null;
                          return (
                            <ExerciseRow
                              key={blockItem.exerciseId}
                              exercise={exercise}
                              tone="bare"
                              detail={`${blockItem.sets} סטים · ${blockItem.reps} חזרות`}
                              onClick={() => setDetail(exercise)}
                              trailing={
                                <Pill className="shrink-0 bg-canvas">
                                  <span className="num">{blockItem.rest}ש׳</span>
                                </Pill>
                              }
                            />
                          );
                        })}
                        <Button
                          block
                          size="lg"
                          className="mt-2"
                          loading={nav.target === '/workout'}
                          onClick={() => {
                            haptic('heavy');
                            startWorkout(program, day.id, byId);
                            nav.go('/workout');
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
      </Rise>

      <ExerciseSheet exercise={detail} onClose={() => setDetail(null)} />

      <RebuildSheet
        open={rebuildOpen}
        onClose={() => setRebuildOpen(false)}
        profile={profile}
        onApply={rebuild}
      />
    </Screen>
  );
}

/** The four inputs a generated program is built from. */
type TrainingSettings = Pick<Profile, 'goal' | 'level' | 'days' | 'place'>;

const DAY_CHOICES = [2, 3, 4, 5, 6];

/**
 * Rebuild sheet.
 *
 * It used to list the settings and send the user to the profile to change
 * them, which meant leaving the screen, editing, and finding the way back.
 * The settings are the entire input to a rebuild, so they are editable right
 * here, and building commits them to the profile as well.
 *
 * Edits are a draft: closing without building changes nothing, and nothing is
 * regenerated until the button is pressed.
 */
function RebuildSheet({
  open,
  onClose,
  profile,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onApply: (settings: TrainingSettings) => void;
}) {
  const [draft, setDraft] = useState<TrainingSettings>(profile);

  // Each opening starts from what the profile says now. Reset during render
  // rather than in an effect, so the sheet never paints last time's draft.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setDraft(profile);
  }

  const changed =
    draft.goal !== profile.goal ||
    draft.level !== profile.level ||
    draft.days !== profile.days ||
    draft.place !== profile.place;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="לבנות מסלול מחדש?"
      subtitle={changed ? 'עם ההגדרות החדשות שבחרתם' : 'אפשר לשנות כאן כל הגדרה'}
      footer={
        <div className="flex gap-3">
          <Button variant="card" size="lg" className="flex-1" onClick={onClose}>
            ביטול
          </Button>
          <Button size="lg" className="flex-1" onClick={() => onApply(draft)}>
            בנו מחדש
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 py-2">
        <Choice label="מטרה">
          {(Object.keys(GOAL_LABEL) as Goal[]).map((goal) => (
            <Chip
              key={goal}
              active={draft.goal === goal}
              onClick={() => setDraft((d) => ({ ...d, goal }))}
            >
              {GOAL_LABEL[goal]}
            </Chip>
          ))}
        </Choice>

        <Choice label="רמת ניסיון">
          {([1, 2, 3] as Level[]).map((level) => (
            <Chip
              key={level}
              active={draft.level === level}
              onClick={() => setDraft((d) => ({ ...d, level }))}
            >
              {LEVEL_LABEL[level]}
            </Chip>
          ))}
        </Choice>

        <Choice label="אימונים בשבוע">
          {DAY_CHOICES.map((days) => (
            <Chip
              key={days}
              active={draft.days === days}
              onClick={() => setDraft((d) => ({ ...d, days }))}
            >
              <span className="digits">{days}</span>
            </Chip>
          ))}
        </Choice>

        <Choice label="ציוד זמין">
          {(Object.keys(PLACE_LABEL) as Place[]).map((place) => (
            <Chip
              key={place}
              active={draft.place === place}
              onClick={() => setDraft((d) => ({ ...d, place }))}
            >
              {PLACE_LABEL[place]}
            </Chip>
          ))}
        </Choice>

        <p className="px-1 text-[13.5px] leading-relaxed text-muted">
          {changed
            ? 'ההגדרות יישמרו בפרופיל שלכם. ההיסטוריה והתרגילים השמורים לא ייפגעו.'
            : 'ההיסטוריה והתרגילים השמורים לא ייפגעו.'}
        </p>
      </div>
    </Sheet>
  );
}

function Choice({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 px-1 text-[15px] font-medium text-muted">{label}</h3>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </section>
  );
}
