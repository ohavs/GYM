'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookmarkSimple,
  CaretLeft,
  ChatCircleText,
  Check,
  DotsThree,
  Fire,
  Lightning,
  Play,
} from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen } from '@/components/layout/screen';
import { Button, IconButton } from '@/components/ui/button';
import { CountUp, Pill, ProgressRing, TINTS, TINT_BG } from '@/components/ui/controls';
import { ExerciseHero } from '@/components/exercise/exercise-card';
import { ExerciseMedia } from '@/components/exercise/exercise-media';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { useAccount, useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { estimateMinutes, useStreak, useTodayPlan, useWeekStats } from '@/lib/session';
import { greeting, initials, relativeDay, volumeLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import type { Exercise } from '@/lib/types';

const WEEK_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function HomePage() {
  const router = useRouter();
  const { byId } = useReadyCatalog();
  const { user } = useAccount();
  const profile = useStore((s) => s.profile);
  const active = useStore((s) => s.active);
  const program = useStore((s) => s.program);
  const logs = useStore((s) => s.logs);
  const saved = useStore((s) => s.saved);
  const startWorkout = useStore((s) => s.startWorkout);

  const [preview, setPreview] = useState<Exercise | null>(null);

  const plan = useTodayPlan();
  const week = useWeekStats();
  const streak = useStreak();

  const start = () => {
    if (!plan || !program) return;
    haptic('heavy');
    startWorkout(program, plan.day.id, byId);
    router.push('/workout');
  };

  const blocks = plan?.day.blocks.slice(0, 3) ?? [];
  const heroExercise = plan ? byId.get(plan.day.blocks[0]?.exerciseId ?? '') : undefined;

  return (
    <Screen>
      <Rise>
        <header className="flex items-center justify-between pt-4 pb-7">
          <Link
            href="/profile"
            aria-label="הפרופיל שלי"
            className="grid size-12 place-items-center overflow-hidden rounded-full bg-lilac text-[15px] font-semibold"
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="size-full object-cover" />
            ) : (
              initials(profile.name || 'מ')
            )}
          </Link>
          <IconButton label="מאגר התרגילים" onClick={() => router.push('/library')}>
            <DotsThree size={22} weight="bold" />
          </IconButton>
        </header>
      </Rise>

      <Rise>
        <div className="mb-8">
          <h1 className="text-[34px] leading-[1.05]">{greeting(profile.name)}</h1>
          <p className="mt-2 text-[15px] text-muted">
            {week.sessions === 0 ? 'מוכנים לאימון?' : 'ממשיכים באותו קצב.'}
          </p>
        </div>
      </Rise>

      {active && (
        <Rise>
          <div className="mb-4 flex items-center gap-4 rounded-[var(--radius-lg)] bg-ink p-4 text-white">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/12">
              <Play size={19} weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-medium">{active.dayName} באוויר</p>
              <p className="text-[13px] text-white/55">
                התחלתם {relativeDay(active.startedAt)}
              </p>
            </div>
            <Button size="sm" variant="card" onClick={() => router.push('/workout')}>
              המשך
            </Button>
          </div>
        </Rise>
      )}

      {plan ? (
        <>
          <Rise>
            <div className="mb-4 flex items-center gap-4 rounded-full bg-mint p-2.5 ps-2.5 pe-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-white">
                <Lightning size={19} weight="fill" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-ink/55">האימון הבא שלך</p>
                <p className="truncate text-[16px] font-medium">{plan.day.name}</p>
              </div>
              <IconButton label="התחלת האימון" tone="ink" size="sm" onClick={start}>
                <ArrowRight size={17} weight="bold" className="flip-rtl" />
              </IconButton>
            </div>
          </Rise>

          <Rise>
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-[20px]">האימון שלך</h2>
              <Link
                href="/program"
                aria-label="כל המסלול"
                className="grid size-9 place-items-center rounded-full text-muted"
              >
                <ArrowRight size={18} weight="bold" className="flip-rtl" />
              </Link>
            </div>
          </Rise>

          <Rise>
            <ul className="mb-4 flex flex-col gap-2.5">
              {blocks.map((block, i) => {
                const exercise = byId.get(block.exerciseId);
                if (!exercise) return null;
                return (
                  <motion.li
                    key={block.exerciseId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Tapping opens the exercise. Sets are ticked inside the
                        workout itself, so no checkbox is offered here. */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 460, damping: 30 }}
                      onClick={() => setPreview(exercise)}
                      className={`flex w-full items-center gap-4 rounded-[var(--radius-md)] ${
                        TINT_BG[TINTS[i % TINTS.length]]
                      } p-3 pe-5 text-start`}
                    >
                      <span className="size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-white/55">
                        <ExerciseMedia exercise={exercise} plain className="size-full" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-[15px] font-medium">{exercise.he}</span>
                        <span className="num mt-0.5 block text-[12.5px] text-ink/55">
                          {block.sets} סטים · {block.reps} חזרות
                        </span>
                      </span>
                      <CaretLeft size={16} weight="bold" className="shrink-0 text-ink/30" />
                    </motion.button>
                  </motion.li>
                );
              })}
            </ul>
          </Rise>

          {heroExercise && (
            <Rise>
              <div className="mb-4">
                <ExerciseHero
                  exercise={heroExercise}
                  tint="peach"
                  eyebrow={plan.day.subtitle}
                  title={plan.day.name}
                  onClick={start}
                  pills={
                    <>
                      <Pill>
                        <span className="num">{plan.day.blocks.length}</span> תרגילים
                      </Pill>
                      <Pill>
                        <span className="num">{estimateMinutes(plan.day)}</span> דקות
                      </Pill>
                    </>
                  }
                  action={
                    <Button size="sm" onClick={start}>
                      <Play size={15} weight="fill" />
                      התחילו
                    </Button>
                  }
                />
              </div>
            </Rise>
          )}
        </>
      ) : (
        <Rise>
          <div className="mb-4 rounded-[var(--radius-lg)] bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-[22px]">עדיין אין לכם מסלול</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
              נבנה תוכנית לפי המטרה, הניסיון והציוד שזמין לכם.
            </p>
            <Button block size="lg" className="mt-5" onClick={() => router.push('/profile')}>
              בניית מסלול
            </Button>
          </div>
        </Rise>
      )}

      {program?.source === 'coach' && program.note && (
        <Rise>
          <div className="mb-4 flex gap-3.5 rounded-[var(--radius-lg)] bg-butter p-5">
            <ChatCircleText size={21} weight="fill" className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[14.5px] font-medium">
                הערה מ{program.coachName ? `המאמן ${program.coachName}` : 'המאמן'}
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/65">{program.note}</p>
            </div>
          </div>
        </Rise>
      )}

      <Rise>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col justify-between rounded-[var(--radius-lg)] bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-full bg-blush">
                <Fire size={17} weight="fill" />
              </span>
              <ProgressRing progress={week.progress} size={40} stroke={4}>
                <span className="digits text-[10px] font-semibold">
                  {week.sessions}/{week.target}
                </span>
              </ProgressRing>
            </div>
            <div className="mt-6">
              <CountUp value={streak} className="text-[34px] font-semibold leading-none" />
              <p className="mt-1 text-[12.5px] text-muted">שבועות ברצף</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[var(--radius-lg)] bg-ink p-5 text-white">
            <span className="grid size-10 place-items-center rounded-full bg-white/12">
              <Lightning size={17} weight="fill" />
            </span>
            <div className="mt-6">
              <p className="num text-[30px] font-semibold leading-none">
                {week.volume ? volumeLabel(week.volume) : '0'}
              </p>
              <p className="mt-1 text-[12.5px] text-white/50">הרמתם השבוע</p>
            </div>
          </div>
        </div>
      </Rise>

      <Rise>
        <div className="mb-4 rounded-[var(--radius-lg)] bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-[17px]">השבוע שלכם</h2>
          <ol className="flex justify-between gap-1.5">
            {WEEK_DAYS.map((label, index) => {
              const done = week.days.has(index);
              const today = new Date().getDay() === index;
              return (
                <li key={label} className="flex flex-1 flex-col items-center gap-2">
                  <span className={`text-[12px] ${today ? 'font-semibold' : 'text-faint'}`}>
                    {label}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{ scale: done ? 1 : 0.88 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                    className={`grid aspect-square w-full max-w-[40px] place-items-center rounded-[14px] ${
                      done ? 'bg-ink text-white' : today ? 'bg-lilac' : 'bg-canvas'
                    }`}
                  >
                    {done && <Check size={14} weight="bold" />}
                  </motion.span>
                </li>
              );
            })}
          </ol>
        </div>
      </Rise>

      {logs.length > 0 && (
        <Rise>
          <div className="mb-4">
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 className="text-[20px]">אימונים אחרונים</h2>
              <Link href="/progress" className="text-[13.5px] text-muted">
                הכל
              </Link>
            </div>
            <ul className="flex flex-col gap-2.5">
              {logs.slice(0, 3).map((log) => (
                <li
                  key={log.id}
                  className="flex items-center gap-4 rounded-[var(--radius-md)] bg-card p-4 shadow-[var(--shadow-soft)]"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint">
                    <Check size={17} weight="bold" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{log.dayName}</span>
                    <span className="block text-[12.5px] text-muted">
                      {relativeDay(log.startedAt)}
                    </span>
                  </span>
                  <span className="num shrink-0 text-[14px] font-medium text-muted">
                    {volumeLabel(log.volume)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Rise>
      )}

      {saved.length > 0 && (
        <Rise>
          <Link
            href="/library?saved=1"
            className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-sky p-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/60">
              <BookmarkSimple size={18} weight="fill" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">התרגילים שסימנתם</span>
              <span className="num block text-[12.5px] text-ink/55">
                {saved.length} תרגילים שמורים
              </span>
            </span>
            <ArrowRight size={18} weight="bold" className="flip-rtl shrink-0 text-ink/40" />
          </Link>
        </Rise>
      )}
      <ExerciseSheet exercise={preview} onClose={() => setPreview(null)} />
    </Screen>
  );
}
