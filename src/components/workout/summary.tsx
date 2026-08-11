'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Barbell, Clock, ListChecks, TrendUp } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { useReadyCatalog } from '@/components/app-providers';
import { durationLabel, volumeLabel } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { WorkoutLog } from '@/lib/types';

export function WorkoutSummary({ log, onClose }: { log: WorkoutLog; onClose: () => void }) {
  const { byId } = useReadyCatalog();
  const logs = useStore((s) => s.logs);
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShow(true), reduce ? 0 : 160);
    return () => clearTimeout(id);
  }, [reduce]);

  const previous = logs.find((l) => l.id !== log.id && l.dayId === log.dayId);
  const delta = previous ? log.volume - previous.volume : null;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[560px] flex-col px-4 safe-t">
      <div className="flex flex-1 flex-col items-center justify-center gap-7 py-10 text-center">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="grid size-24 place-items-center rounded-[32px] bg-accent text-accent-ink"
        >
          <Barbell size={40} weight="bold" />
        </motion.span>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[30px] leading-tight"
          >
            אימון הושלם
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-[15px] text-muted"
          >
            {log.dayName}
          </motion.p>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 14 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full grid-cols-3 gap-3"
        >
          <SummaryTile
            icon={<Clock size={16} weight="bold" />}
            value={durationLabel(log.endedAt - log.startedAt)}
            label="משך"
          />
          <SummaryTile
            icon={<ListChecks size={16} weight="bold" />}
            value={String(log.sets)}
            label="סטים"
          />
          <SummaryTile
            icon={<Barbell size={16} weight="bold" />}
            value={volumeLabel(log.volume)}
            label="נפח"
          />
        </motion.dl>

        {delta !== null && delta !== 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 1 } : {}}
            transition={{ delay: 0.25 }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-semibold ${
              delta > 0 ? 'bg-ok-wash text-ok' : 'bg-surface-2 text-muted'
            }`}
          >
            <TrendUp size={15} weight="bold" className={delta > 0 ? '' : 'rotate-180'} />
            {delta > 0 ? 'עלייה של ' : 'ירידה של '}
            <span className="num">{volumeLabel(Math.abs(delta))}</span> מול הפעם הקודמת
          </motion.p>
        )}

        <motion.ul
          initial={{ opacity: 0 }}
          animate={show ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="w-full divide-y divide-line-soft rounded-[var(--radius-card)] border border-line bg-surface text-start"
        >
          {log.entries.map((entry) => {
            const exercise = byId.get(entry.exerciseId);
            if (!exercise) return null;
            const top = Math.max(...entry.sets.map((s) => s.weight));
            return (
              <li key={entry.exerciseId} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                  {exercise.he}
                </span>
                <span className="num shrink-0 text-[13px] text-muted">
                  {entry.sets.length} × {top > 0 ? `${top} ק״ג` : 'משקל גוף'}
                </span>
              </li>
            );
          })}
        </motion.ul>
      </div>

      <div className="pb-[max(env(safe-area-inset-bottom),20px)]">
        <Button block size="lg" onClick={onClose}>
          חזרה לבית
        </Button>
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[var(--radius-card)] border border-line bg-surface px-2 py-4">
      <span className="text-accent">{icon}</span>
      <dd className="num text-[17px] font-bold leading-tight">{value}</dd>
      <dt className="text-[12px] text-muted">{label}</dt>
    </div>
  );
}
