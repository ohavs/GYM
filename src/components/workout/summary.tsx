'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Clock, Barbell, ListChecks, TrendUp } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { CountUp } from '@/components/ui/controls';
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
    const id = setTimeout(() => setShow(true), reduce ? 0 : 220);
    return () => clearTimeout(id);
  }, [reduce]);

  const previous = logs.find((l) => l.id !== log.id && l.dayId === log.dayId);
  const delta = previous ? log.volume - previous.volume : null;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col px-5 safe-t">
      <div className="flex flex-1 flex-col justify-center gap-8 py-10">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 17 }}
          className="mx-auto grid size-28 place-items-center rounded-full bg-mint"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 380, damping: 16 }}
          >
            <Check size={44} weight="bold" />
          </motion.span>
        </motion.div>

        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="text-[34px] leading-tight"
          >
            אימון הושלם
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="mt-2 text-[16px] text-muted"
          >
            {log.dayName}
          </motion.p>
        </div>

        <motion.dl
          initial={{ opacity: 0, y: 18 }}
          animate={show ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 gap-3"
        >
          <Tile
            tint="bg-peach"
            icon={<Clock size={17} weight="bold" />}
            value={durationLabel(log.endedAt - log.startedAt)}
            label="משך"
          />
          <Tile
            tint="bg-lilac"
            icon={<ListChecks size={17} weight="bold" />}
            value={<CountUp value={log.sets} />}
            label="סטים"
          />
          <Tile
            tint="bg-butter"
            icon={<Barbell size={17} weight="bold" />}
            value={volumeLabel(log.volume)}
            label="הרמתם"
          />
        </motion.dl>

        {delta !== null && delta !== 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={show ? { opacity: 1 } : {}}
            transition={{ delay: 0.28 }}
            className={`mx-auto flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium ${
              delta > 0 ? 'bg-mint' : 'bg-card shadow-[var(--shadow-soft)] text-muted'
            }`}
          >
            <TrendUp size={16} weight="bold" className={delta > 0 ? '' : 'rotate-180'} />
            {delta > 0 ? 'עלייה של ' : 'ירידה של '}
            <span className="num">{volumeLabel(Math.abs(delta))}</span> מול הפעם הקודמת
          </motion.p>
        )}

        <motion.ul
          initial={{ opacity: 0 }}
          animate={show ? { opacity: 1 } : {}}
          transition={{ delay: 0.34 }}
          className="flex flex-col gap-2"
        >
          {log.entries.map((entry) => {
            const exercise = byId.get(entry.exerciseId);
            if (!exercise) return null;
            const top = Math.max(...entry.sets.map((s) => s.weight));
            return (
              <li
                key={entry.exerciseId}
                className="flex items-center gap-3 rounded-[var(--radius-md)] bg-card px-5 py-4 shadow-[var(--shadow-soft)]"
              >
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium">
                  {exercise.he}
                </span>
                <span className="num shrink-0 text-[13.5px] text-muted">
                  {entry.sets.length} × {top > 0 ? `${top} ק״ג` : 'משקל גוף'}
                </span>
              </li>
            );
          })}
        </motion.ul>
      </div>

      <div className="pb-[max(env(safe-area-inset-bottom),22px)]">
        <Button block size="lg" onClick={onClose}>
          חזרה לבית
        </Button>
      </div>
    </div>
  );
}

function Tile({
  tint,
  icon,
  value,
  label,
}: {
  tint: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-[var(--radius-lg)] ${tint} px-4 py-5`}>
      <span className="grid size-9 place-items-center rounded-full bg-white/55">{icon}</span>
      <div>
        <dd className="num text-[19px] font-semibold leading-tight">{value}</dd>
        <dt className="mt-0.5 text-[12px] text-ink/55">{label}</dt>
      </div>
    </div>
  );
}
