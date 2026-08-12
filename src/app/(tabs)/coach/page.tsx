'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  CaretLeft,
  Check,
  Copy,
  ShareNetwork,
  UserPlus,
  UsersThree,
  X,
} from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState, Field, OptionCard, Segmented, Slider } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { SignInSheet } from '@/components/account/sign-in-sheet';
import { InviteCard } from '@/components/coach/invite-card';
import { useAccount, useLinksContext, useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { seedTrainees } from '@/lib/demo';
import { approveLink, endLink } from '@/lib/links';
import { adherenceOf, adherenceTone, fromLink, fromLocal, useActivity, type RosterEntry } from '@/lib/roster';
import { buildProgram, GOAL_LABEL, LEVEL_LABEL, PLACE_LABEL } from '@/lib/program';
import { avatarHue, initials, relativeDay } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';
import type { Goal, Level, Place } from '@/lib/types';

type Sort = 'attention' | 'name';

export default function CoachPage() {
  const { exercises, meta } = useReadyCatalog();
  const toast = useToast();
  const { user } = useAccount();
  const links = useLinksContext();
  const activity = useActivity(links);

  const trainees = useStore((s) => s.trainees);
  const upsertTrainee = useStore((s) => s.upsertTrainee);

  const [sort, setSort] = useState<Sort>('attention');
  const [addOpen, setAddOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  const pending = links.asCoach.filter((l) => l.status === 'pending');

  const roster = useMemo(() => {
    const list: RosterEntry[] = [
      ...links.asCoach.filter((l) => l.status === 'active').map((l) => fromLink(l, activity.get(l.traineeUid))),
      ...trainees.map(fromLocal),
    ];
    if (sort === 'name') return list.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    return list.sort((a, b) => adherenceOf(a) - adherenceOf(b) || b.lastActive - a.lastActive);
  }, [links.asCoach, trainees, activity, sort]);

  const behind = roster.filter((t) => adherenceOf(t) < 0.7).length;

  const empty = !roster.length && !pending.length;

  return (
    <Screen>
      <ScreenHeader
        title="המתאמנים שלי"
        subtitle={
          empty
            ? undefined
            : behind
              ? `${behind} לא עומדים בקצב`
              : 'כולם עומדים בקצב'
        }
        action={
          !empty ? (
            <IconButton label="הוספת מתאמן" tone="ink" onClick={() => setAddOpen(true)} className="mt-1">
              <UserPlus size={19} weight="bold" />
            </IconButton>
          ) : undefined
        }
      />

      {/* Requests come first: somebody is waiting on an answer. */}
      <AnimatePresence initial={false}>
        {pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <Rise>
              <SectionTitle>
                ממתינים לאישור <span className="digits text-muted">{pending.length}</span>
              </SectionTitle>
            </Rise>
            <ul className="mb-8 flex flex-col gap-3">
              {pending.map((link) => (
                <motion.li key={link.id} layout exit={{ opacity: 0, scale: 0.96 }}>
                  <PendingCard
                    name={link.traineeName}
                    goal={link.traineeGoal}
                    onApprove={async () => {
                      haptic('success');
                      await approveLink(link.id);
                      toast({ text: `${link.traineeName} הצטרפו`, detail: 'אפשר לבנות להם מסלול', tone: 'ok' });
                    }}
                    onDecline={async () => {
                      haptic('tap');
                      await endLink(link.id);
                      toast({ text: 'הבקשה נדחתה', tone: 'info' });
                    }}
                  />
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {empty ? (
        <>
          <EmptyState
            icon={<UsersThree size={30} />}
            title="עוד אין מתאמנים"
            body="שתפו את קוד ההצטרפות שלכם, וכל מי שיזין אותו יופיע כאן לאישור."
            action={
              <Button size="lg" variant="card" onClick={() => setAddOpen(true)}>
                או הוספה ידנית
              </Button>
            }
          />
          <Rise>
            <div className="mt-8">
              <InviteCard onNeedsAccount={() => setSignInOpen(true)} />
            </div>
          </Rise>
          <Rise>
            <button
              type="button"
              onClick={() => {
                seedTrainees(exercises, meta).forEach(upsertTrainee);
                toast({ text: 'נוספו מתאמני הדגמה', tone: 'ok' });
              }}
              className="mt-5 w-full text-center text-[13.5px] font-medium text-muted"
            >
              הצגת רשימת הדגמה
            </button>
          </Rise>
        </>
      ) : (
        <>
          <Rise>
            <div className="mb-6">
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
          </Rise>

          <ul className="flex flex-col gap-3">
            {roster.map((entry, i) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <TraineeCard entry={entry} />
              </motion.li>
            ))}
          </ul>

          <Rise>
            <div className="mt-8">
              <InviteCard onNeedsAccount={() => setSignInOpen(true)} />
            </div>
          </Rise>
        </>
      )}

      <AddTraineeSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />
      {!user && null}
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

function PendingCard({
  name,
  goal,
  onApprove,
  onDecline,
}: {
  name: string;
  goal: Goal;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const hue = avatarHue(name);
  return (
    <div className="flex items-center gap-3.5 rounded-[var(--radius-lg)] bg-butter p-4">
      <span
        className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[15px] font-semibold text-on-ink"
        style={{ background: `linear-gradient(140deg, hsl(${hue} 42% 52%), hsl(${hue + 16} 40% 38%))` }}
      >
        {initials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] font-medium">{name}</p>
        <p className="truncate text-[12.5px] text-on-tint/72">{GOAL_LABEL[goal]}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <IconButton label={`דחיית ${name}`} size="sm" tone="card" onClick={onDecline}>
          <X size={16} weight="bold" />
        </IconButton>
        <IconButton label={`אישור ${name}`} size="sm" tone="ink" onClick={onApprove}>
          <Check size={16} weight="bold" />
        </IconButton>
      </div>
    </div>
  );
}

function TraineeCard({ entry }: { entry: RosterEntry }) {
  const value = adherenceOf(entry);
  const tone = adherenceTone(value);
  const hue = avatarHue(entry.name);
  const toneClass = { ok: 'text-green', warn: 'text-amber', bad: 'text-red' }[tone];
  const barClass = { ok: 'bg-green', warn: 'bg-amber', bad: 'bg-red' }[tone];

  return (
    <Link
      href={`/coach/trainee?id=${entry.id}`}
      className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-card p-4 pe-5 shadow-[var(--shadow-soft)]"
    >
      <span
        className="relative grid size-14 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[16px] font-semibold text-on-ink"
        style={{ background: `linear-gradient(140deg, hsl(${hue} 42% 52%), hsl(${hue + 16} 40% 38%))` }}
      >
        {initials(entry.name)}
        {entry.kind === 'linked' && (
          <span
            aria-hidden
            className="absolute -bottom-1 -end-1 size-4 rounded-full border-[3px] border-card bg-green"
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[16.5px] font-medium">{entry.name}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {entry.kind === 'linked'
            ? entry.lastActive
              ? `התאמן ${relativeDay(entry.lastActive)}`
              : 'עוד לא התאמן'
            : GOAL_LABEL[entry.goal]}
        </p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: value }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'right' }}
              className={`block h-full rounded-full ${barClass}`}
            />
          </span>
          <span className={`digits shrink-0 text-[12.5px] font-semibold ${toneClass}`}>
            {entry.done}/{entry.planned}
          </span>
        </div>
      </div>

      <CaretLeft size={18} weight="bold" className="shrink-0 text-faint" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */

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
      note: note.trim(),
      program,
    });
    toast({ text: `${name.trim()} נוסף`, detail: 'בנינו מסלול ראשוני', tone: 'ok' });
    setName('');
    setNote('');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="מתאמן חדש"
      subtitle="בלי חשבון — נשמר אצלכם בלבד"
      footer={
        <Button block size="lg" disabled={name.trim().length < 2} onClick={submit}>
          הוספה ובניית מסלול
        </Button>
      }
    >
      <div className="flex flex-col gap-6 py-2">
        <Field label="שם" value={name} onChange={setName} placeholder="השם של המתאמן" />

        <div>
          <p className="mb-3 px-1 text-[14px] font-medium text-ink-soft">מטרה</p>
          <div className="flex flex-col gap-2.5">
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
          <p className="mb-3 px-1 text-[14px] font-medium text-ink-soft">רמה</p>
          <Segmented<string>
            size="sm"
            value={String(level)}
            onChange={(v) => setLevel(Number(v) as Level)}
            options={[1, 2, 3].map((l) => ({ value: String(l), label: LEVEL_LABEL[l as Level] }))}
          />
        </div>

        <Slider label="אימונים בשבוע" value={days} min={2} max={6} onChange={setDays} />

        <div>
          <p className="mb-3 px-1 text-[14px] font-medium text-ink-soft">ציוד</p>
          <div className="flex flex-col gap-2.5">
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

        <Field label="הערה" value={note} onChange={setNote} placeholder="פציעות, העדפות, כל דבר" />
      </div>
    </Sheet>
  );
}

export { Copy, ShareNetwork };
