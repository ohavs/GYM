'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChartLineUp, Medal, Trophy } from '@phosphor-icons/react/dist/ssr';
import { Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { EmptyState, Segmented, Stat } from '@/components/ui/controls';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { useNow } from '@/lib/clock';
import { useStore } from '@/lib/store';
import { personalBests } from '@/lib/session';
import { durationLabel, relativeDay, shortDate, volumeLabel, weekKey } from '@/lib/format';
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

  const bests = useMemo(() => personalBests(logs, byId).slice(0, 6), [logs, byId]);
  const peak = Math.max(...weeks.map((w) => w.volume), 1);

  if (!logs.length) {
    return (
      <Screen>
        <ScreenHeader title="התקדמות" />
        <EmptyState
          icon={<ChartLineUp size={26} />}
          title="עוד לא נרשמו אימונים"
          body="אחרי האימון הראשון תראו כאן נפח שבועי, שיאים אישיים והיסטוריה מלאה."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="התקדמות" subtitle="כל מה שנרשם מאז שהתחלתם" />

      <section className="card mb-4 grid grid-cols-2 gap-y-5 p-5">
        <Stat value={String(totals.sessions)} label="אימונים" tone="accent" numeric />
        <Stat value={volumeLabel(totals.volume)} label="נפח כולל" />
        <Stat value={String(totals.sets)} label="סטים" numeric />
        <Stat value={durationLabel(totals.minutes)} label="זמן אימון" />
      </section>

      <section className="card mb-4 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[17px]">נפח שבועי</h2>
          <div className="w-[136px]">
            <Segmented
              size="sm"
              value={range}
              onChange={setRange}
              options={[
                { value: '8', label: '8 שב׳' },
                { value: '16', label: '16 שב׳' },
              ]}
            />
          </div>
        </div>

        <ol className="flex h-40 items-end gap-1" role="list" aria-label="נפח אימונים לפי שבוע">
          {weeks.map((week, i) => {
            const height = week.volume ? Math.max(6, (week.volume / peak) * 100) : 3;
            const last = i === weeks.length - 1;
            return (
              <li key={week.key} className="group flex h-full flex-1 flex-col justify-end">
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: `${height}%`, transformOrigin: 'bottom' }}
                  className={`w-full rounded-t-[5px] ${
                    week.volume ? (last ? 'bg-accent' : 'bg-accent/45') : 'bg-surface-3'
                  }`}
                  title={`${shortDate(week.key)}: ${volumeLabel(week.volume)}`}
                />
              </li>
            );
          })}
        </ol>
        <div className="mt-2 flex justify-between text-[11px] text-faint">
          <span>{shortDate(weeks[0].key)}</span>
          <span>השבוע</span>
        </div>
        <p className="mt-3 border-t border-line-soft pt-3 text-[13px] text-muted">
          שיא נפח שבועי: <span className="num font-bold text-text">{volumeLabel(peak)}</span>
        </p>
      </section>

      {bests.length > 0 && (
        <section className="mb-4">
          <SectionTitle>שיאים אישיים</SectionTitle>
          <ul className="flex flex-col gap-2">
            {bests.map((best) => (
              <li key={best.exercise.id}>
                <button
                  type="button"
                  onClick={() => setDetail(best.exercise)}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface px-4 py-3 text-start"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-wash text-accent">
                    <Trophy size={16} weight="fill" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">
                      {best.exercise.he}
                    </span>
                    <span className="block text-[12px] text-muted">{relativeDay(best.at)}</span>
                  </span>
                  <span className="num shrink-0 text-[15px] font-bold">
                    {best.weight} <span className="text-[11px] text-faint">ק״ג</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle>היסטוריית אימונים</SectionTitle>
        <ul className="flex flex-col gap-2">
          {logs.slice(0, 20).map((log) => (
            <li
              key={log.id}
              className="flex items-center gap-3 rounded-[var(--radius-field)] border border-line bg-surface px-4 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                <Medal size={16} weight="bold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{log.dayName}</span>
                <span className="block text-[12px] text-muted">
                  {relativeDay(log.startedAt)} · <span className="num">{log.sets}</span> סטים ·{' '}
                  {durationLabel(log.endedAt - log.startedAt)}
                </span>
              </span>
              <span className="num shrink-0 text-[13px] font-bold text-muted">
                {volumeLabel(log.volume)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <ExerciseSheet exercise={detail} onClose={() => setDetail(null)} />
    </Screen>
  );
}
