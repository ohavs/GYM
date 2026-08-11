'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChartLineUp, Trophy } from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { CountUp, EmptyState, Stat } from '@/components/ui/controls';
import { ExerciseMedia } from '@/components/exercise/exercise-media';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { useNow } from '@/lib/clock';
import { useStore } from '@/lib/store';
import { personalBests } from '@/lib/session';
import { durationLabel, hoursLabel, relativeDay, shortDate, volumeLabel, weekKey } from '@/lib/format';
import type { Exercise } from '@/lib/types';

type Range = '8' | '16';

export default function ProgressPage() {
  const { byId } = useReadyCatalog();
  const now = useNow();
  const logs = useStore((s) => s.logs);
  const [range, setRange] = useState<Range>('8');
  const [detail, setDetail] = useState<Exercise | null>(null);

  const weeks = useMemo(() => {
    const count = Number(range);
    const current = weekKey(now);
    const buckets = Array.from({ length: count }, (_, i) => ({
      key: current - (count - 1 - i) * 7 * 86_400_000,
      volume: 0,
      sessions: 0,
    }));
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    for (const log of logs) {
      const i = index.get(weekKey(log.startedAt));
      if (i === undefined) continue;
      buckets[i].volume += log.volume;
      buckets[i].sessions += 1;
    }
    return buckets;
  }, [logs, range, now]);

  const totals = useMemo(
    () => ({
      sessions: logs.length,
      volume: logs.reduce((sum, log) => sum + log.volume, 0),
      minutes: logs.reduce((sum, log) => sum + (log.endedAt - log.startedAt), 0),
      sets: logs.reduce((sum, log) => sum + log.sets, 0),
    }),
    [logs],
  );

  const bests = useMemo(() => personalBests(logs, byId).slice(0, 5), [logs, byId]);
  const peak = Math.max(...weeks.map((w) => w.volume), 1);

  if (!logs.length) {
    return (
      <Screen>
        <ScreenHeader title="התקדמות" />
        <EmptyState
          icon={<ChartLineUp size={30} />}
          title="עוד לא נרשמו אימונים"
          body="אחרי האימון הראשון תראו כאן כמה הרמתם בכל שבוע, שיאים אישיים והיסטוריה מלאה."
          tint="mint"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="התקדמות" subtitle="כל מה שנרשם מאז שהתחלתם" />

      {/* The dark card is the mockup's anchor: one big number, one calm line. */}
      <Rise>
        <section className="mb-4 rounded-[var(--radius-lg)] bg-ink p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-baseline gap-2">
                <CountUp
                  value={totals.volume / 1000}
                  decimals={1}
                  className="text-[40px] font-semibold leading-none"
                />
                <span className="text-[15px] text-white/50">טון</span>
              </p>
              <p className="mt-2 text-[13px] text-white/50">סך הכל הרמתם</p>
            </div>
            <div className="w-[128px]">
              <SegmentedDark value={range} onChange={setRange} />
            </div>
          </div>

          <VolumeChart weeks={weeks} peak={peak} />

          <div className="flex justify-between text-[11px] text-white/40">
            <span>{shortDate(weeks[0].key)}</span>
            <span>השבוע</span>
          </div>
        </section>
      </Rise>

      <Rise>
        <section className="mb-8 grid grid-cols-3 gap-3">
          <TintTile tint="bg-peach" value={String(totals.sessions)} label="אימונים" numeric />
          <TintTile tint="bg-mint" value={String(totals.sets)} label="סטים" numeric />
          <TintTile tint="bg-lilac" value={hoursLabel(totals.minutes)} label="זמן אימון" />
        </section>
      </Rise>

      {bests.length > 0 && (
        <Rise>
          <section className="mb-8">
            <SectionTitle>שיאים אישיים</SectionTitle>
            <ul className="flex flex-col gap-2.5">
              {bests.map((best) => (
                <li key={best.exercise.id}>
                  <button
                    type="button"
                    onClick={() => setDetail(best.exercise)}
                    className="flex w-full items-center gap-4 rounded-[var(--radius-md)] bg-card p-3 pe-5 text-start shadow-[var(--shadow-soft)]"
                  >
                    <ExerciseMedia
                      exercise={best.exercise}
                      className="size-14 shrink-0 rounded-[var(--radius-sm)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[14.5px] font-medium leading-snug">
                        {best.exercise.he}
                      </span>
                      <span className="block text-[12.5px] text-muted">{relativeDay(best.at)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Trophy size={15} weight="fill" className="text-amber" />
                      <span className="num text-[18px] font-semibold">{best.weight}</span>
                      <span className="text-[11px] text-faint">ק״ג</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </Rise>
      )}

      <Rise>
        <section>
          <SectionTitle>היסטוריית אימונים</SectionTitle>
          <ul className="flex flex-col gap-2.5">
            {logs.slice(0, 20).map((log) => (
              <li
                key={log.id}
                className="flex items-center gap-4 rounded-[var(--radius-md)] bg-card p-4 px-5 shadow-[var(--shadow-soft)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{log.dayName}</span>
                  <span className="num block text-[12.5px] text-muted">
                    {relativeDay(log.startedAt)} · {log.sets} סטים ·{' '}
                    {durationLabel(log.endedAt - log.startedAt)}
                  </span>
                </span>
                <span className="num shrink-0 text-[14px] font-medium text-muted">
                  {volumeLabel(log.volume)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </Rise>

      <ExerciseSheet exercise={detail} onClose={() => setDetail(null)} />
    </Screen>
  );
}

/** Line chart drawn as a path so it traces itself in on mount. */
function VolumeChart({ weeks, peak }: { weeks: { key: number; volume: number }[]; peak: number }) {
  const reduce = useReducedMotion();
  const w = 100;
  const h = 42;

  const points = weeks.map((week, i) => {
    // Oldest week on the right: the chart reads in the same direction as the page.
    const x = weeks.length > 1 ? (1 - i / (weeks.length - 1)) * w : w / 2;
    const y = h - (week.volume / peak) * (h - 8) - 4;
    return { x, y, ...week };
  });

  const path = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(' ');

  const last = points.at(-1);

  return (
    <div className="mt-8 mb-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-32 w-full overflow-visible"
        role="img"
        aria-label="כמה משקל הרמתם בכל שבוע"
      >
        {[0.3, 0.65, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2={w}
            y1={h * f}
            y2={h * f}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <motion.path
          d={path}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        {last && (
          <motion.circle
            cx={last.x}
            cy={last.y}
            r="4"
            fill="#ffffff"
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.85, type: 'spring', stiffness: 380, damping: 18 }}
          />
        )}
      </svg>
    </div>
  );
}

function SegmentedDark({ value, onChange }: { value: Range; onChange: (v: Range) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-white/10 p-1">
      {(['8', '16'] as Range[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`h-9 rounded-full text-[12.5px] font-medium transition-colors ${
            value === option ? 'bg-white text-ink' : 'text-white/60'
          }`}
        >
          {option} שב׳
        </button>
      ))}
    </div>
  );
}

function TintTile({
  tint,
  value,
  label,
  numeric,
}: {
  tint: string;
  value: string;
  label: string;
  numeric?: boolean;
}) {
  return (
    <div className={`rounded-[var(--radius-lg)] ${tint} px-4 py-5`}>
      <Stat value={value} label={label} numeric={numeric} />
    </div>
  );
}
