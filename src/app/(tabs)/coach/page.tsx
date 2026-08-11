'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CaretLeft, Plus, UsersThree } from '@phosphor-icons/react/dist/ssr';
import { Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState, Field, OptionCard, Segmented, Slider } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { adherence, adherenceTone, seedTrainees } from '@/lib/demo';
import { buildProgram, GOAL_LABEL, LEVEL_LABEL, PLACE_LABEL } from '@/lib/program';
import { avatarHue, initials, relativeDay } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import type { Goal, Level, Place, Trainee } from '@/lib/types';

type Sort = 'attention' | 'name';

export default function CoachPage() {
  const { exercises, meta } = useReadyCatalog();
  const toast = useToast();
  const trainees = useStore((s) => s.trainees);
  const upsertTrainee = useStore((s) => s.upsertTrainee);

  const [sort, setSort] = useState<Sort>('attention');
  const [addOpen, setAddOpen] = useState(false);

  const sorted = useMemo(() => {
    const list = [...trainees];
    if (sort === 'name') return list.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    return list.sort((a, b) => adherence(a) - adherence(b) || b.lastActive - a.lastActive);
  }, [trainees, sort]);

  const needsAttention = trainees.filter((t) => adherence(t) < 0.7).length;

  if (!trainees.length) {
    return (
      <Screen>
        <ScreenHeader title="המתאמנים שלי" />
        <EmptyState
          icon={<UsersThree size={26} />}
          title="עוד אין מתאמנים"
          body="הוסיפו מתאמן ראשון ובנו לו מסלול, או התחילו מרשימת הדגמה כדי לראות איך זה עובד."
          action={
            <div className="flex gap-2.5">
              <Button onClick={() => setAddOpen(true)}>הוספת מתאמן</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  seedTrainees(exercises, meta).forEach(upsertTrainee);
                  toast({ text: 'נוספו מתאמני הדגמה', tone: 'ok' });
                }}
              >
                רשימת הדגמה
              </Button>
            </div>
          }
        />
        <AddTraineeSheet open={addOpen} onClose={() => setAddOpen(false)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="המתאמנים שלי"
        subtitle={
          needsAttention
            ? `${needsAttention} מתאמנים מתחת ליעד ההתמדה`
            : 'כולם עומדים ביעד ההתמדה'
        }
        action={
          <IconButton label="הוספת מתאמן" tone="accent" onClick={() => setAddOpen(true)}>
            <Plus size={19} weight="bold" />
          </IconButton>
        }
      />

      <div className="mb-4">
        <Segmented<Sort>
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'attention', label: 'לפי דחיפות' },
            { value: 'name', label: 'לפי שם' },
          ]}
        />
      </div>

      <SectionTitle>
        <span className="num">{trainees.length}</span> מתאמנים פעילים
      </SectionTitle>

      <ul className="flex flex-col gap-2.5">
        {sorted.map((trainee, i) => (
          <motion.li
            key={trainee.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <TraineeCard trainee={trainee} />
          </motion.li>
        ))}
      </ul>

      <AddTraineeSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </Screen>
  );
}

function TraineeCard({ trainee }: { trainee: Trainee }) {
  const value = adherence(trainee);
  const tone = adherenceTone(value);
  const hue = avatarHue(trainee.name);
  const toneClass = { ok: 'text-ok', warn: 'text-warn', bad: 'text-bad' }[tone];
  const barClass = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad' }[tone];

  return (
    <Link
      href={`/coach/${trainee.id}`}
      className="flex items-center gap-3.5 rounded-[var(--radius-card)] border border-line bg-surface p-4"
    >
      <span
        className="grid size-12 shrink-0 place-items-center rounded-2xl text-[15px] font-bold text-white"
        style={{ background: `linear-gradient(140deg, hsl(${hue} 46% 42%), hsl(${hue + 14} 42% 27%))` }}
      >
        {initials(trainee.name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold">{trainee.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {GOAL_LABEL[trainee.goal]} · פעיל {relativeDay(trainee.lastActive)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${value * 100}%` }} />
          </span>
          <span className={`digits shrink-0 text-[12px] font-bold ${toneClass}`}>
            {trainee.done}/{trainee.planned}
          </span>
        </div>
      </div>

      <CaretLeft size={17} weight="bold" className="shrink-0 text-faint" />
    </Link>
  );
}

function AddTraineeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { exercises, meta } = useReadyCatalog();
  const upsertTrainee = useStore((s) => s.upsertTrainee);
  const toast = useToast();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>('muscle');
  const [level, setLevel] = useState<Level>(1);
  const [days, setDays] = useState(3);
  const [place, setPlace] = useState<Place>('gym');
  const [note, setNote] = useState('');

  const submit = () => {
    const now = Date.now();
    const program = {
      ...buildProgram({ goal, level, days, place, focus: [], exercises, meta }),
      id: `prog-${now}`,
      source: 'coach' as const,
      note,
    };
    upsertTrainee({
      id: `tr-${now}`,
      name: name.trim(),
      goal,
      level,
      days,
      place,
      joinedAt: now,
      lastActive: now,
      done: 0,
      planned: days * 4,
      note,
      program,
    });
    toast({ text: 'המתאמן נוסף', detail: `בנינו ל${name.trim()} מסלול פתיחה`, tone: 'ok' });
    setName('');
    setNote('');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="מתאמן חדש"
      subtitle="נבנה מסלול פתיחה אוטומטית, ותוכלו לערוך אותו אחר כך"
      footer={
        <Button block disabled={name.trim().length < 2} onClick={submit}>
          הוספה ובניית מסלול
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <Field label="שם המתאמן" value={name} onChange={setName} placeholder="שם מלא" maxLength={30} />

        <div>
          <p className="mb-2.5 text-[14px] font-semibold">מטרה</p>
          <div className="flex flex-col gap-2">
            {(Object.keys(GOAL_LABEL) as Goal[]).map((option) => (
              <OptionCard
                key={option}
                selected={goal === option}
                onSelect={() => setGoal(option)}
                title={GOAL_LABEL[option]}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2.5 text-[14px] font-semibold">רמה</p>
          <Segmented<string>
            value={String(level)}
            onChange={(v) => setLevel(Number(v) as Level)}
            options={[
              { value: '1', label: LEVEL_LABEL[1] },
              { value: '2', label: LEVEL_LABEL[2] },
              { value: '3', label: LEVEL_LABEL[3] },
            ]}
          />
        </div>

        <Slider label="אימונים בשבוע" value={days} min={2} max={6} onChange={setDays} />

        <div>
          <p className="mb-2.5 text-[14px] font-semibold">ציוד</p>
          <div className="flex flex-col gap-2">
            {(Object.keys(PLACE_LABEL) as Place[]).map((option) => (
              <OptionCard
                key={option}
                selected={place === option}
                onSelect={() => setPlace(option)}
                title={PLACE_LABEL[option]}
              />
            ))}
          </div>
        </div>

        <Field
          label="הערה למתאמן"
          value={note}
          onChange={setNote}
          placeholder="מגבלות, פציעות או דגשים"
          hint="ההערה תופיע למתאמן במסך הבית שלו."
          maxLength={140}
        />
      </div>
    </Sheet>
  );
}
