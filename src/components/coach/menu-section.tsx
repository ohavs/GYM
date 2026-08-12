'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretDown, ForkKnife, PencilSimple, Scales } from '@phosphor-icons/react/dist/ssr';
import { SectionTitle } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { MenuEditor } from '@/components/coach/menu-editor';
import { MenuDayView } from '@/components/nutrition/menu-day';
import { dayKey, starterMenu, useDailyHistory, type Menu } from '@/lib/nutrition';
import { useToast } from '@/components/ui/toast';
import { haptic } from '@/lib/haptics';
import { shortDate } from '@/lib/format';

/**
 * The coach's nutrition panel for one trainee: the menu they wrote, and what
 * came back from it.
 *
 * Adherence is read from the trainee's own daily documents rather than copied
 * anywhere, so it is live and it stops the moment the link ends.
 */
export function MenuSection({
  traineeUid,
  menu,
  onSave,
  onRemove,
}: {
  /** Only a linked trainee has one, and only they report adherence back. */
  traineeUid?: string;
  menu: Menu | null;
  onSave: (menu: Menu) => Promise<void> | void;
  onRemove: () => Promise<void> | void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Menu | null>(null);
  const history = useDailyHistory(traineeUid, menu);

  const open = (base: Menu) => {
    haptic('select');
    setDraft(base);
    setEditing(true);
  };

  const save = async () => {
    if (!draft) return;
    haptic('success');
    await onSave(draft);
    setEditing(false);
    toast({
      text: 'התפריט נשמר',
      detail: traineeUid ? 'המתאמן יראה אותו מיד' : 'מתאמן מקומי, נשמר על המכשיר',
      tone: 'ok',
    });
  };

  return (
    <>
      <SectionTitle
        action={
          menu ? (
            <button
              type="button"
              onClick={() => open(menu)}
              className="flex items-center gap-1.5 text-[13.5px] font-medium text-muted"
            >
              <PencilSimple size={14} weight="bold" />
              עריכה
            </button>
          ) : undefined
        }
      >
        תפריט
      </SectionTitle>

      {!menu ? (
        <div className="mb-8 rounded-[var(--radius-lg)] bg-card p-6 shadow-[var(--shadow-soft)]">
          <span className="mb-4 grid size-12 place-items-center rounded-[var(--radius-sm)] bg-peach">
            <ForkKnife size={20} weight="fill" />
          </span>
          <h3 className="text-[17px]">עוד אין תפריט</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
            בנו תפריט יומי, והמתאמן יסמן כל ארוחה שאכל. תראו כאן כמה נצמד אליו.
          </p>
          <Button size="lg" className="mt-5" onClick={() => open(starterMenu())}>
            בניית תפריט
          </Button>
        </div>
      ) : (
        <div className="mb-8 flex flex-col gap-3">
          {traineeUid ? (
            <Adherence history={history} />
          ) : (
            <p className="rounded-[var(--radius-lg)] bg-butter p-5 text-[13.5px] leading-relaxed">
              מתאמן מקומי, כך שאין ממי לקבל סימונים. אצל מתאמן מחובר תראו כאן כמה נצמד לתפריט.
            </p>
          )}
          <MenuPreview menu={menu} />
        </div>
      )}

      <Sheet
        open={editing}
        onClose={() => setEditing(false)}
        title="עריכת התפריט"
        subtitle="הכל בטקסט חופשי. קלוריות הן רשות."
        full
        footer={
          <div className="flex gap-3">
            <Button variant="card" size="lg" className="flex-1" onClick={() => setEditing(false)}>
              ביטול
            </Button>
            <Button size="lg" className="flex-[2]" onClick={save}>
              שמירה ושליחה
            </Button>
          </div>
        }
      >
        {draft && (
          <div className="py-2">
            <MenuEditor
              menu={draft}
              onChange={setDraft}
              onRemove={async () => {
                haptic('warn');
                await onRemove();
                setEditing(false);
                toast({ text: 'התפריט נמחק', tone: 'info' });
              }}
            />
          </div>
        )}
      </Sheet>
    </>
  );
}

function Adherence({ history }: { history: ReturnType<typeof useDailyHistory> }) {
  if (!history) {
    return <div className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-card" />;
  }

  const rate = history.planned ? history.done / history.planned : 0;
  const tone = rate >= 0.8 ? 'bg-green' : rate >= 0.55 ? 'bg-amber' : 'bg-red';
  const recent = history.days.slice(0, 14).reverse();

  return (
    <div className="rounded-[var(--radius-lg)] bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[14.5px] font-medium">הצמדה לתפריט</p>
        <p className="num text-[13px] text-muted">
          {history.done}/{history.planned} בשבועיים
        </p>
      </div>

      {/* One column per day: the shape of the fortnight says more than a mean. */}
      <div className="mt-4 flex items-end gap-1" dir="ltr">
        {recent.map((day) => {
          const share = day.planned ? day.done / day.planned : 0;
          return (
            <div key={day.day} className="flex-1" title={`${day.day}: ${day.done}/${day.planned}`}>
              <div className="flex h-10 items-end">
                <motion.span
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: Math.max(share, 0.06) }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'bottom' }}
                  className={`block w-full rounded-t-[4px] ${share > 0 ? tone : 'bg-line'}`}
                  // A full-height box scaled down keeps every bar the same
                  // rounded shape rather than squashing the corners.
                  {...{ 'aria-hidden': true }}
                >
                  <span className="block h-10" />
                </motion.span>
              </div>
            </div>
          );
        })}
      </div>

      {history.weight && (
        <p className="num mt-4 flex items-center gap-2 border-t border-line pt-4 text-[13.5px] text-muted">
          <Scales size={15} weight="bold" />
          {history.weight} ק״ג
          {history.weightAt && (
            <span className="text-faint">
              · {shortDate(new Date(history.weightAt).getTime())}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function MenuPreview({ menu }: { menu: Menu }) {
  const [open, setOpen] = useState(false);
  const today = dayKey();

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-soft)]">
      <button
        type="button"
        onClick={() => {
          haptic('select');
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-start"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-peach">
          <ForkKnife size={19} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-medium">{menu.name}</span>
          <span className="num mt-0.5 block text-[12.5px] text-muted">
            {menu.days[0]?.meals.length ?? 0} ארוחות ביום
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0 text-faint">
          <CaretDown size={18} weight="bold" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-4">
              <MenuDayView
                menu={menu}
                log={{ day: today, meals: {}, updatedAt: 0 }}
                onSet={() => {}}
                readOnly
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
