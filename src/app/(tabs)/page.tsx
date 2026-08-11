'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookmarkSimple,
  ChatCircleText,
  Clock,
  Fire,
  ListChecks,
  Play,
  Sparkle,
} from '@phosphor-icons/react/dist/ssr';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/controls';
import { ExerciseMedia } from '@/components/exercise/exercise-media';
import { useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { estimateMinutes, useStreak, useTodayPlan, useWeekStats } from '@/lib/session';
import { greeting, relativeDay, volumeLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';

const WEEK_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function HomePage() {
  const router = useRouter();
  const { byId } = useReadyCatalog();
  const profile = useStore((s) => s.profile);
  const active = useStore((s) => s.active);
  const program = useStore((s) => s.program);
  const logs = useStore((s) => s.logs);
  const saved = useStore((s) => s.saved);
  const startWorkout = useStore((s) => s.startWorkout);

  const plan = useTodayPlan();
  const week = useWeekStats();
  const streak = useStreak();

  const start = () => {
    if (!plan || !program) return;
    haptic('heavy');
    startWorkout(program, plan.day.id, byId);
    router.push('/workout');
  };

  const previews = plan
    ? plan.day.blocks.slice(0, 4).map((b) => byId.get(b.exerciseId)).filter(Boolean)
    : [];

  return (
    <Screen>
      <header className="flex items-center justify-between gap-3 pt-4 pb-6">
        <div className="min-w-0">
          <h1 className="truncate text-[24px] leading-tight">{greeting(profile.name)}</h1>
          <p className="mt-1 text-[14px] text-muted">
            {week.sessions === 0
              ? 'שבוע חדש. בואו נתחיל.'
              : `${week.sessions} מתוך ${week.target} אימונים השבוע`}
          </p>
        </div>
        <ProgressRing progress={week.progress} size={56} stroke={6}>
          <span className="digits text-[13px] font-bold">
            {week.sessions}
            <span className="text-faint">/{week.target}</span>
          </span>
        </ProgressRing>
      </header>

      {active && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-accent-line bg-accent-wash p-3.5"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink">
            <Play size={19} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{active.dayName} באוויר</p>
            <p className="text-[13px] text-muted">
              התחלתם {relativeDay(active.startedAt)}. אפשר להמשיך מאיפה שעצרתם.
            </p>
          </div>
          <Button size="sm" onClick={() => router.push('/workout')}>
            המשך
          </Button>
        </motion.div>
      )}

      {plan ? (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
        >
          <div className="flex items-start gap-4 p-5 pb-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-accent">האימון הבא שלך</p>
              <h2 className="mt-1 text-[24px] leading-tight">{plan.day.name}</h2>
              <p className="mt-1 text-[14px] text-muted">{plan.day.subtitle}</p>
            </div>
            <span className="digits rounded-full bg-surface-2 px-3 py-1 text-[12px] font-bold text-muted">
              {plan.index + 1}/{plan.program.days.length}
            </span>
          </div>

          <div className="flex gap-2 px-5">
            {previews.map((exercise, i) => (
              <motion.div
                key={exercise!.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 320, damping: 26 }}
                className="flex-1"
              >
                <ExerciseMedia
                  exercise={exercise!}
                  className="aspect-square w-full rounded-xl border border-line"
                />
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-4 px-5 pt-3.5 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <ListChecks size={15} weight="bold" />
              <span className="num">{plan.day.blocks.length}</span> תרגילים
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} weight="bold" />
              <span className="num">{estimateMinutes(plan.day)}</span> דקות
            </span>
          </div>

          <div className="flex gap-2.5 p-5 pt-4">
            <Button block size="lg" onClick={start}>
              <Play size={18} weight="fill" />
              התחילו אימון
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/program')}
              aria-label="צפייה בכל המסלול"
              className="px-5"
            >
              <ArrowRight size={18} weight="bold" className="flip-rtl" />
            </Button>
          </div>
        </motion.section>
      ) : (
        <section className="card p-5">
          <h2 className="text-[19px]">עדיין אין לכם מסלול</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
            נבנה תוכנית לפי המטרה, הניסיון והציוד שזמין לכם.
          </p>
          <Button block className="mt-4" onClick={() => router.push('/profile')}>
            בניית מסלול
          </Button>
        </section>
      )}

      {program?.source === 'coach' && program.note && (
        <section className="mt-4 flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface-2 p-4">
          <ChatCircleText size={20} weight="fill" className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">
              הערה מ{program.coachName ? `המאמן ${program.coachName}` : 'המאמן'}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">{program.note}</p>
          </div>
        </section>
      )}

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="card flex flex-col justify-between p-4">
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <Fire size={15} weight="fill" className="text-accent" />
            רצף שבועות
          </span>
          <span className="num mt-3 text-[28px] font-bold leading-none">{streak}</span>
        </div>
        <div className="card flex flex-col justify-between p-4">
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            <Sparkle size={15} weight="fill" className="text-accent" />
            נפח השבוע
          </span>
          <span className="num mt-3 text-[28px] font-bold leading-none">
            {week.volume ? volumeLabel(week.volume) : '0'}
          </span>
        </div>
      </section>

      <section className="mt-4 card p-4">
        <h2 className="mb-3 text-[15px]">השבוע שלכם</h2>
        <ol className="flex justify-between gap-1.5">
          {WEEK_DAYS.map((label, index) => {
            const done = week.days.has(index);
            const today = new Date().getDay() === index;
            return (
              <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className={`text-[12px] ${today ? 'font-bold text-text' : 'text-faint'}`}>
                  {label}
                </span>
                <motion.span
                  initial={false}
                  animate={{ scale: done ? 1 : 0.86 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className={`grid aspect-square w-full max-w-[42px] place-items-center rounded-xl border text-[12px] font-bold ${
                    done
                      ? 'border-transparent bg-accent text-accent-ink'
                      : today
                        ? 'border-accent-line bg-accent-wash text-accent'
                        : 'border-line bg-surface-2 text-faint'
                  }`}
                >
                  {done ? <Fire size={15} weight="fill" /> : ''}
                </motion.span>
              </li>
            );
          })}
        </ol>
      </section>

      {logs.length > 0 && (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px]">אימונים אחרונים</h2>
            <Link href="/progress" className="text-[13px] font-semibold text-accent">
              הכל
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {logs.slice(0, 3).map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface px-4 py-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ok-wash text-ok">
                  <ListChecks size={16} weight="bold" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{log.dayName}</span>
                  <span className="block text-[12px] text-muted">
                    {relativeDay(log.startedAt)}
                  </span>
                </span>
                <span className="num shrink-0 text-[13px] font-bold text-muted">
                  {volumeLabel(log.volume)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {saved.length > 0 && (
        <Link
          href="/library?saved=1"
          className="mt-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-wash text-accent">
            <BookmarkSimple size={17} weight="fill" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">התרגילים שסימנתם</span>
            <span className="block text-[12px] text-muted">
              <span className="num">{saved.length}</span> תרגילים שמורים
            </span>
          </span>
          <ArrowRight size={17} weight="bold" className="flip-rtl text-faint" />
        </Link>
      )}
    </Screen>
  );
}
