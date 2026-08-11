'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, Reorder, motion } from 'motion/react';
import {
  CaretDown,
  DotsSixVertical,
  Eye,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen, ScreenHeader, SectionTitle } from '@/components/layout/screen';
import { Button, IconButton } from '@/components/ui/button';
import { EmptyState, Field, Stepper, TINT_BG, tintFor } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { ExerciseMedia } from '@/components/exercise/exercise-media';
import { ExercisePicker } from '@/components/coach/exercise-picker';
import { useReadyCatalog } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { adherence } from '@/lib/demo';
import { GOAL_LABEL, LEVEL_LABEL, PLACE_LABEL } from '@/lib/program';
import { estimateMinutes } from '@/lib/session';
import { avatarHue, initials, relativeDay, shortDate } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';
import type { Block, Program } from '@/lib/types';

/**
 * The trainee id travels in the query string rather than the path. Ids are
 * created at runtime, so a path segment would force this route to be rendered
 * on a server; as a query it stays a static page the app can host anywhere.
 */
export default function TraineePage() {
  return (
    <Suspense fallback={null}>
      <TraineeDetail />
    </Suspense>
  );
}

function TraineeDetail() {
  const id = useSearchParams().get('id') ?? '';
  const router = useRouter();
  const toast = useToast();
  const { byId } = useReadyCatalog();

  const trainee = useStore((s) => s.trainees.find((t) => t.id === id));
  const upsertTrainee = useStore((s) => s.upsertTrainee);
  const removeTrainee = useStore((s) => s.removeTrainee);
  const setTraineeProgram = useStore((s) => s.setTraineeProgram);
  const setProgram = useStore((s) => s.setProgram);
  const profileName = useStore((s) => s.profile.name);

  const [openDay, setOpenDay] = useState<string | null>(null);
  const [pickerDay, setPickerDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ dayId: string; index: number } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!trainee) {
    return (
      <Screen>
        <ScreenHeader title="מתאמן" back />
        <EmptyState
          icon={<Eye size={30} />}
          title="המתאמן לא נמצא"
          body="ייתכן שהוא הוסר מהרשימה."
          action={<Button onClick={() => router.replace('/coach')}>חזרה לרשימה</Button>}
        />
      </Screen>
    );
  }

  const program = trainee.program;
  const value = adherence(trainee);
  const hue = avatarHue(trainee.name);

  const updateProgram = (next: Program) => setTraineeProgram(trainee.id, next);

  const patchBlock = (dayId: string, index: number, patch: Partial<Block>) => {
    if (!program) return;
    updateProgram({
      ...program,
      days: program.days.map((day) =>
        day.id !== dayId
          ? day
          : { ...day, blocks: day.blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)) },
      ),
    });
  };

  const removeBlock = (dayId: string, index: number) => {
    if (!program) return;
    haptic('warn');
    updateProgram({
      ...program,
      days: program.days.map((day) =>
        day.id !== dayId ? day : { ...day, blocks: day.blocks.filter((_, i) => i !== index) },
      ),
    });
  };

  const reorderBlocks = (dayId: string, blocks: Block[]) => {
    if (!program) return;
    updateProgram({
      ...program,
      days: program.days.map((day) => (day.id !== dayId ? day : { ...day, blocks })),
    });
  };

  const editingBlock =
    editing && program
      ? program.days.find((d) => d.id === editing.dayId)?.blocks[editing.index]
      : null;

  return (
    <Screen>
      <ScreenHeader title={trainee.name} subtitle={GOAL_LABEL[trainee.goal]} back />

      <Rise>
        <section className="mb-4 rounded-[var(--radius-lg)] bg-hero p-6 text-on-hero">
          <div className="flex items-center gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[17px] font-semibold text-on-hero"
              style={{ background: `linear-gradient(140deg, hsl(${hue} 42% 52%), hsl(${hue + 16} 40% 38%))` }}
            >
              {initials(trainee.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] text-on-hero/70">
                {LEVEL_LABEL[trainee.level]} · {PLACE_LABEL[trainee.place]}
              </p>
              <p className="mt-1 text-[12.5px] text-on-hero/65">
                הצטרף {shortDate(trainee.joinedAt)} · פעיל {relativeDay(trainee.lastActive)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 items-start gap-3 border-t border-on-hero/10 pt-5 text-on-hero">
            <div className="flex flex-col gap-1">
              <span className="digits text-[26px] font-semibold leading-none">
                {trainee.done}/{trainee.planned}
              </span>
              <span className="text-[12px] text-on-hero/65">אימונים שבוצעו</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="digits text-[26px] font-semibold leading-none">
                {Math.round(value * 100)}%
              </span>
              <span className="text-[12px] text-on-hero/65">מהתוכנית</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="num text-[26px] font-semibold leading-none">{trainee.days}</span>
              <span className="text-[12px] text-on-hero/65">אימונים בשבוע</span>
            </div>
          </div>
        </section>
      </Rise>

      <Rise>
        <section className="mb-8 rounded-[var(--radius-lg)] bg-butter p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-on-tint/72">הערה למתאמן</p>
              <p className="mt-1.5 text-[14.5px] leading-relaxed">
                {trainee.note || 'עוד לא הוספתם הערה.'}
              </p>
            </div>
            <IconButton
              label="עריכת ההערה"
              size="sm"
              onClick={() => {
                setNoteDraft(trainee.note);
                setNoteOpen(true);
              }}
            >
              <PencilSimple size={16} weight="bold" />
            </IconButton>
          </div>
        </section>
      </Rise>

      {program ? (
        <>
          <Rise>
            <SectionTitle
              action={
                <span className="num text-[13px] text-faint">{program.days.length} ימים</span>
              }
            >
              עורך המסלול
            </SectionTitle>
          </Rise>

          <ul className="flex flex-col gap-3.5">
            {program.days.map((day, dayIndex) => {
              const expanded = openDay === day.id;
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
                      className={`num grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] ${TINT_BG[tintFor(day.id, dayIndex)]} text-[16px] font-semibold`}
                    >
                      {dayIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-medium">{day.name}</span>
                      <span className="num mt-0.5 block text-[12.5px] text-muted">
                        {day.blocks.length} תרגילים · {estimateMinutes(day)} דק׳
                      </span>
                    </span>
                    <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="text-faint">
                      <CaretDown size={18} weight="bold" />
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
                        <div className="px-3 pb-3">
                          <Reorder.Group
                            axis="y"
                            values={day.blocks}
                            onReorder={(blocks) => reorderBlocks(day.id, blocks)}
                            className="flex flex-col gap-2"
                          >
                            {day.blocks.map((blockItem, index) => {
                              const exercise = byId.get(blockItem.exerciseId);
                              if (!exercise) return null;
                              return (
                                <Reorder.Item
                                  key={blockItem.exerciseId}
                                  value={blockItem}
                                  whileDrag={{ scale: 1.03, boxShadow: 'var(--shadow-lift)' }}
                                  className="flex items-center gap-2.5 rounded-[var(--radius-md)] bg-canvas p-2.5"
                                >
                                  <span className="cursor-grab touch-none px-0.5 text-faint active:cursor-grabbing">
                                    <DotsSixVertical size={18} weight="bold" />
                                  </span>
                                  <ExerciseMedia
                                    exercise={exercise}
                                    className="size-12 shrink-0 rounded-[var(--radius-xs)]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEditing({ dayId: day.id, index })}
                                    className="min-w-0 flex-1 text-start"
                                  >
                                    <span className="line-clamp-1 text-[14px] font-medium">
                                      {exercise.he}
                                    </span>
                                    <span className="mt-0.5 block text-[12px] text-muted">
                                      <span className="num">
                                        {blockItem.sets}×{blockItem.reps}
                                      </span>{' '}
                                      · מנוחה <span className="num">{blockItem.rest}</span> שנ׳
                                    </span>
                                  </button>
                                  <IconButton
                                    label="הסרת תרגיל"
                                    onClick={() => removeBlock(day.id, index)}
                                    tone="bare"
                                    size="sm"
                                    className="text-faint"
                                  >
                                    <Trash size={16} weight="bold" />
                                  </IconButton>
                                </Reorder.Item>
                              );
                            })}
                          </Reorder.Group>

                          <button
                            type="button"
                            onClick={() => setPickerDay(day.id)}
                            className="mt-1 flex h-13 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border-[1.5px] border-dashed border-line-strong text-[14.5px] font-medium text-muted"
                          >
                            <Plus size={15} weight="bold" />
                            הוספת תרגיל ל{day.name}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              block
              size="lg"
              onClick={() => {
                haptic('success');
                upsertTrainee({ ...trainee, lastActive: Date.now() });
                toast({
                  text: 'המסלול נשלח',
                  detail: `${trainee.name} יראה את העדכון בכניסה הבאה`,
                  tone: 'ok',
                });
              }}
            >
              <PaperPlaneTilt size={17} weight="fill" />
              שליחת המסלול למתאמן
            </Button>
            <Button
              block
              size="lg"
              variant="card"
              onClick={() => {
                setProgram({
                  ...program,
                  source: 'coach',
                  coachName: profileName || 'המאמן',
                  note: trainee.note,
                });
                toast({
                  text: 'המסלול נטען אליכם',
                  detail: 'ככה בדיוק המתאמן רואה אותו',
                  tone: 'info',
                });
                router.push('/program');
              }}
            >
              <Eye size={17} weight="bold" />
              תצוגה מקדימה כמתאמן
            </Button>
            <Button block size="lg" variant="danger" onClick={() => setConfirmRemove(true)}>
              הסרת המתאמן
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Plus size={30} />}
          title="אין מסלול למתאמן הזה"
          body="בנו לו מסלול כדי להתחיל לעקוב אחרי ההתקדמות."
        />
      )}

      <ExercisePicker
        open={pickerDay !== null}
        onClose={() => setPickerDay(null)}
        place={trainee.place}
        excludeIds={
          program?.days.find((d) => d.id === pickerDay)?.blocks.map((b) => b.exerciseId) ?? []
        }
        onPick={(exercise) => {
          if (!program || !pickerDay) return;
          haptic('success');
          updateProgram({
            ...program,
            days: program.days.map((day) =>
              day.id !== pickerDay
                ? day
                : {
                    ...day,
                    blocks: [
                      ...day.blocks,
                      { exerciseId: exercise.id, sets: 3, reps: '10-12', rest: 90 },
                    ],
                  },
            ),
          });
          toast({ text: 'התרגיל נוסף', detail: exercise.he, tone: 'ok' });
        }}
      />

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="עריכת התרגיל"
        subtitle={
          editingBlock ? byId.get(editingBlock.exerciseId)?.he : undefined
        }
        footer={
          <Button block size="lg" onClick={() => setEditing(null)}>
            סיום
          </Button>
        }
      >
        {editing && editingBlock && (
          <div className="flex flex-col gap-5 py-2">
            <EditRow label="מספר סטים">
              <Stepper
                value={editingBlock.sets}
                min={1}
                max={10}
                onChange={(sets) => patchBlock(editing.dayId, editing.index, { sets })}
              />
            </EditRow>

            <div className="flex flex-col gap-2">
              <span className="px-1 text-[15px] font-medium">טווח חזרות</span>
              <div className="flex flex-wrap gap-2.5">
                {['5', '6-8', '8-10', '10-12', '12-15', '15-20', '30-45 שניות'].map((reps) => (
                  <button
                    key={reps}
                    type="button"
                    onClick={() => patchBlock(editing.dayId, editing.index, { reps })}
                    className={`h-11 rounded-full px-4.5 text-[14px] font-medium transition-colors ${
                      editingBlock.reps === reps
                        ? 'bg-ink text-on-ink'
                        : 'bg-card text-ink-soft shadow-[var(--shadow-soft)]'
                    }`}
                  >
                    {reps}
                  </button>
                ))}
              </div>
            </div>

            <EditRow label="מנוחה בשניות">
              <Stepper
                value={editingBlock.rest}
                min={15}
                max={300}
                step={15}
                onChange={(rest) => patchBlock(editing.dayId, editing.index, { rest })}
              />
            </EditRow>

            <Field
              label="הערה לתרגיל"
              value={editingBlock.note ?? ''}
              onChange={(note) => patchBlock(editing.dayId, editing.index, { note })}
              placeholder="טמפו, דגש טכני או משקל התחלה"
              maxLength={80}
            />
          </div>
        )}
      </Sheet>

      <Sheet
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="הערה למתאמן"
        footer={
          <Button
            block
            size="lg"
            onClick={() => {
              upsertTrainee({ ...trainee, note: noteDraft });
              if (program) updateProgram({ ...program, note: noteDraft });
              setNoteOpen(false);
              toast({ text: 'ההערה נשמרה', tone: 'ok' });
            }}
          >
            שמירה
          </Button>
        }
      >
        <div className="py-2">
          <Field
            label="מה חשוב שהמתאמן ידע?"
            value={noteDraft}
            onChange={setNoteDraft}
            placeholder="מגבלות, פציעות או דגשים לשבוע הקרוב"
            maxLength={140}
            autoFocus
          />
        </div>
      </Sheet>

      <Sheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`להסיר את ${trainee.name}?`}
        subtitle="המסלול וההערות שלו יימחקו"
        footer={
          <div className="flex gap-3">
            <Button variant="card" size="lg" className="flex-1" onClick={() => setConfirmRemove(false)}>
              ביטול
            </Button>
            <Button
              variant="danger"
              size="lg"
              className="flex-1"
              onClick={() => {
                removeTrainee(trainee.id);
                router.replace('/coach');
              }}
            >
              הסרה
            </Button>
          </div>
        }
      >
        <p className="py-2 text-[14px] leading-relaxed text-muted">
          אפשר להוסיף אותו מחדש בכל רגע, אבל המסלול שבניתם לא יישמר.
        </p>
      </Sheet>
    </Screen>
  );
}

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-card px-5 py-3.5 shadow-[var(--shadow-soft)]">
      <span className="text-[15px] font-medium">{label}</span>
      {children}
    </div>
  );
}
