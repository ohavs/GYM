'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowUUpLeft, Check, ForkKnife, X } from '@phosphor-icons/react/dist/ssr';
import { TINT_BG, tintFor } from '@/components/ui/controls';
import { mealTotals, type DailyLog, type Meal, type MealStatus, type Menu } from '@/lib/nutrition';
import { haptic } from '@/lib/haptics';

/**
 * The trainee's day of eating.
 *
 * Every meal is one tap to tick off and one more to undo, because that is the
 * whole interaction and it happens four times a day with one hand. Skipping is
 * a first-class answer rather than an absence: a coach learns more from "לא
 * אכלתי" than from a meal that was simply never touched.
 */
export function MenuDayView({
  menu,
  log,
  onSet,
  readOnly = false,
}: {
  menu: Menu;
  log: DailyLog;
  onSet: (mealId: string, status: MealStatus | null) => void;
  readOnly?: boolean;
}) {
  const day = menu.days[0];
  if (!day) return null;

  const done = day.meals.filter((m) => log.meals[m.id]?.status === 'done').length;

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <div className="mb-1 flex items-center justify-between gap-3 px-1">
          <p className="text-[13.5px] text-muted">
            <span className="num font-medium text-ink">
              {done}/{day.meals.length}
            </span>{' '}
            ארוחות היום
          </p>
          <div className="flex gap-1">
            {day.meals.map((meal) => (
              <span
                key={meal.id}
                className={`h-1.5 w-5 rounded-full transition-colors ${
                  log.meals[meal.id]?.status === 'done'
                    ? 'bg-green'
                    : log.meals[meal.id]?.status === 'skipped'
                      ? 'bg-line-strong'
                      : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {day.meals.map((meal, index) => (
        <MealRow
          key={meal.id}
          meal={meal}
          tint={tintFor(meal.id, index)}
          status={log.meals[meal.id]?.status}
          readOnly={readOnly}
          onSet={(status) => onSet(meal.id, status)}
        />
      ))}
    </div>
  );
}

function MealRow({
  meal,
  tint,
  status,
  readOnly,
  onSet,
}: {
  meal: Meal;
  tint: ReturnType<typeof tintFor>;
  status?: MealStatus;
  readOnly: boolean;
  onSet: (status: MealStatus | null) => void;
}) {
  const totals = mealTotals(meal);
  const items = meal.items.filter((i) => i.text.trim());
  const done = status === 'done';
  const skipped = status === 'skipped';

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={`overflow-hidden rounded-[var(--radius-lg)] transition-colors ${
        done ? 'bg-mint' : skipped ? 'bg-card opacity-60 shadow-[var(--shadow-soft)]' : 'bg-card shadow-[var(--shadow-soft)]'
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] ${
            done ? 'bg-tint-well' : TINT_BG[tint]
          }`}
        >
          {done ? <Check size={19} weight="bold" /> : <ForkKnife size={19} weight="fill" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className={`truncate text-[16px] font-medium ${skipped ? 'line-through' : ''}`}>
              {meal.name}
            </p>
            {meal.time && <p className="num shrink-0 text-[12.5px] text-muted">{meal.time}</p>}
          </div>

          <ul className="mt-1.5 flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.id} className="text-[14px] leading-relaxed text-ink-soft">
                {item.text}
                {item.kcal ? <span className="num ms-1.5 text-[12.5px] text-muted">{item.kcal} קל׳</span> : null}
              </li>
            ))}
            {!items.length && <li className="text-[13.5px] text-faint">אין פריטים בארוחה הזאת</li>}
          </ul>

          {totals.kcal > 0 && (
            <p className="num mt-2 text-[12.5px] text-muted">
              סה״כ {totals.kcal} קל׳
              {totals.protein > 0 && <> · {totals.protein} גרם חלבון</>}
            </p>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="flex gap-2.5 px-4 pb-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {status ? (
              <motion.button
                key="undo"
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                onClick={() => {
                  haptic('tap');
                  onSet(null);
                }}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-tint-well text-[14px] font-medium"
              >
                <ArrowUUpLeft size={15} weight="bold" className="flip-rtl" />
                {done ? 'סימנתי בטעות' : 'ביטול'}
              </motion.button>
            ) : (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex flex-1 gap-2.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    haptic('success');
                    onSet('done');
                  }}
                  className="flex h-11 flex-[2] items-center justify-center gap-1.5 rounded-full bg-ink text-[14px] font-medium text-on-ink"
                >
                  <Check size={15} weight="bold" />
                  אכלתי
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic('tap');
                    onSet('skipped');
                  }}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-canvas text-[14px] font-medium text-muted"
                >
                  <X size={15} weight="bold" />
                  דילגתי
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
