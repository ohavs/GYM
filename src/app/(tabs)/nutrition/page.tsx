'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ForkKnife, PencilSimple, Scales } from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen, ScreenHeader } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { EmptyState, Stepper } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { MenuDayView } from '@/components/nutrition/menu-day';
import { MenuEditor } from '@/components/coach/menu-editor';
import { useAccount, useLinksContext } from '@/components/app-providers';
import { useNavigation } from '@/components/layout/navigation';
import { useStore } from '@/lib/store';
import { assignedMenu, dayKey, starterMenu, useDailyLog, type Menu } from '@/lib/nutrition';
import { initials } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';

/**
 * The day of eating, and the one place it gets reported back.
 *
 * A coach's menu takes over while their link is active and is read-only here —
 * that is the point of having one. Without a coach the same screen is a menu
 * this person writes for themselves, in the same editor a coach uses, so
 * nobody is left waiting for someone else to start them off.
 */
export default function NutritionPage() {
  const nav = useNavigation();
  const toast = useToast();
  const { user } = useAccount();
  const links = useLinksContext();

  const ownMenu = useStore((s) => s.menu);
  const setMenu = useStore((s) => s.setMenu);

  const fromCoach = assignedMenu(links);
  const menu = fromCoach?.menu ?? ownMenu;
  const mine = !fromCoach;

  const today = dayKey();
  const { log, setMeal, setWeight } = useDailyLog(user?.uid ?? null, today);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Menu | null>(null);

  const openEditor = (base: Menu) => {
    haptic('select');
    setDraft(base);
    setEditing(true);
  };

  if (!menu) {
    return (
      <Screen>
        <ScreenHeader title="התפריט שלי" />
        <EmptyState
          icon={<ForkKnife size={30} />}
          title={links.asTrainee.length ? 'המאמן עוד לא בנה תפריט' : 'עוד אין תפריט'}
          body={
            links.asTrainee.length
              ? 'אפשר לבנות תפריט לעצמכם בינתיים. כשהמאמן ישלח את שלו, הוא יופיע כאן במקומו.'
              : 'בנו תפריט יומי וסמנו כל ארוחה שאכלתם. אם יש לכם מאמן, אפשר גם לקבל ממנו תפריט.'
          }
          action={
            // A fixed width so a stacked pair reads as one block rather than
            // two buttons of different sizes.
            <div className="flex w-[248px] max-w-full flex-col gap-3">
              <Button block size="lg" onClick={() => openEditor(starterMenu())}>
                בניית תפריט
              </Button>
              {!links.asTrainee.length && (
                <Button block size="lg" variant="card" onClick={() => nav.go('/join')}>
                  הצטרפות למאמן
                </Button>
              )}
            </div>
          }
        />
        <EditorSheet
          open={editing}
          draft={draft}
          onDraft={setDraft}
          onClose={() => setEditing(false)}
          onSave={(next) => {
            setMenu(next);
            setEditing(false);
            toast({ text: 'התפריט נשמר', tone: 'ok' });
          }}
          onRemove={() => {
            setMenu(null);
            setEditing(false);
          }}
        />
      </Screen>
    );
  }

  const day = menu.days[0];
  const done = day?.meals.filter((m) => log.meals[m.id]?.status === 'done').length ?? 0;
  const total = day?.meals.length ?? 0;

  return (
    <Screen>
      <ScreenHeader
        title="התפריט שלי"
        subtitle={menu.name}
        action={
          mine ? (
            <button
              type="button"
              onClick={() => openEditor(menu)}
              aria-label="עריכת התפריט"
              className="mt-1 grid size-12 shrink-0 place-items-center rounded-full bg-card text-ink-soft shadow-[var(--shadow-soft)]"
            >
              <PencilSimple size={17} weight="bold" />
            </button>
          ) : undefined
        }
      />

      <Rise>
        <section className="mb-6 rounded-[var(--radius-lg)] bg-hero p-6 text-on-hero">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] text-on-hero/68">היום</p>
              <p className="num mt-1 text-[34px] font-semibold leading-none">
                {done}
                <span className="text-[20px] text-on-hero/68">/{total}</span>
              </p>
              <p className="mt-2 text-[13px] text-on-hero/68">ארוחות סומנו</p>
            </div>
            {fromCoach && (
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-on-hero/12 text-[13px] font-semibold">
                {initials(fromCoach.coachName)}
              </span>
            )}
          </div>

          {/* One tap between weighing yourself and it being recorded. */}
          <div className="mt-6 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-on-hero/12 px-4 py-3">
            <span className="flex items-center gap-2 text-[14px]">
              <Scales size={17} weight="bold" />
              משקל הבוקר
            </span>
            <WeightField value={log.weight} onChange={setWeight} />
          </div>
        </section>
      </Rise>

      {menu.note && (
        <Rise>
          <p className="mb-5 rounded-[var(--radius-lg)] bg-butter p-5 text-[14px] leading-relaxed">
            {menu.note}
          </p>
        </Rise>
      )}

      <Rise>
        <motion.div layout>
          <MenuDayView menu={menu} log={log} onSet={setMeal} />
        </motion.div>
      </Rise>

      {mine && (
        <Rise>
          <Button block size="lg" variant="card" className="mt-6" onClick={() => openEditor(menu)}>
            <PencilSimple size={16} weight="bold" />
            עריכת התפריט
          </Button>
        </Rise>
      )}

      <EditorSheet
        open={editing}
        draft={draft}
        onDraft={setDraft}
        onClose={() => setEditing(false)}
        onSave={(next) => {
          setMenu(next);
          setEditing(false);
          toast({ text: 'התפריט עודכן', tone: 'ok' });
        }}
        onRemove={() => {
          setMenu(null);
          setEditing(false);
          toast({ text: 'התפריט נמחק', tone: 'info' });
        }}
      />
    </Screen>
  );
}

function WeightField({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
}) {
  const [adding, setAdding] = useState(false);
  if (!adding && value === undefined) {
    return (
      <button
        type="button"
        onClick={() => {
          haptic('select');
          setAdding(true);
        }}
        className="rounded-full bg-on-hero px-4 py-2 text-[13px] font-medium text-hero"
      >
        הוספה
      </button>
    );
  }
  return (
    <Stepper
      value={value ?? 70}
      onChange={onChange}
      step={0.5}
      min={30}
      max={250}
      compact
      label="משקל גוף"
    />
  );
}

function EditorSheet({
  open,
  draft,
  onDraft,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  draft: Menu | null;
  onDraft: (menu: Menu) => void;
  onClose: () => void;
  onSave: (menu: Menu) => void;
  onRemove: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="התפריט שלי"
      subtitle="בחרו מהמאגר או הקלידו בעצמכם"
      full
      footer={
        <div className="flex gap-3">
          <Button variant="card" size="lg" className="flex-1" onClick={onClose}>
            ביטול
          </Button>
          <Button
            size="lg"
            className="flex-[2]"
            onClick={() => {
              if (draft) {
                haptic('success');
                onSave(draft);
              }
            }}
          >
            שמירה
          </Button>
        </div>
      }
    >
      {draft && (
        <div className="py-2">
          <MenuEditor menu={draft} onChange={onDraft} onRemove={onRemove} />
        </div>
      )}
    </Sheet>
  );
}
