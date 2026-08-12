'use client';


import { AnimatePresence, motion } from 'motion/react';
import { CaretDown, Clock, ForkKnife, Plus, Trash, X } from '@phosphor-icons/react/dist/ssr';
import { Button, IconButton } from '@/components/ui/button';
import { TINT_BG, tintFor } from '@/components/ui/controls';
import { useExclusivePanel } from '@/lib/store';
import {
  dayTotals,
  mealTotals,
  newItem,
  newMeal,
  type Meal,
  type MealItem,
  type Menu,
} from '@/lib/nutrition';
import { haptic } from '@/lib/haptics';

/**
 * The coach's menu builder.
 *
 * Everything is free text on purpose — see the note in lib/nutrition. The
 * shape deliberately mirrors the program editor (day → meal → item, against
 * day → block → exercise) so the two halves of a coach's work feel like one
 * tool rather than two.
 */
export function MenuEditor({
  menu,
  onChange,
  onRemove,
}: {
  menu: Menu;
  onChange: (menu: Menu) => void;
  onRemove: () => void;
}) {
  const [openMeal, setOpenMeal] = useExclusivePanel(
    'coach:meal',
    menu.days.flatMap((d) => d.meals.map((m) => m.id)),
    menu.days[0]?.meals[0]?.id ?? null,
  );

  const patchMeal = (dayId: string, mealId: string, patch: Partial<Meal>) =>
    onChange({
      ...menu,
      days: menu.days.map((day) =>
        day.id !== dayId
          ? day
          : { ...day, meals: day.meals.map((m) => (m.id === mealId ? { ...m, ...patch } : m)) },
      ),
    });

  const removeMeal = (dayId: string, mealId: string) => {
    haptic('warn');
    onChange({
      ...menu,
      days: menu.days.map((day) =>
        day.id !== dayId ? day : { ...day, meals: day.meals.filter((m) => m.id !== mealId) },
      ),
    });
  };

  const addMeal = (dayId: string) => {
    haptic('tap');
    const meal = newMeal('ארוחה');
    onChange({
      ...menu,
      days: menu.days.map((day) =>
        day.id !== dayId ? day : { ...day, meals: [...day.meals, meal] },
      ),
    });
    setOpenMeal(meal.id);
  };

  return (
    <div className="flex flex-col gap-6">
      {menu.days.map((day) => {
        const totals = dayTotals(day);
        return (
          <section key={day.id}>
            <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
              <h3 className="text-[17px]">{day.name}</h3>
              {(totals.kcal > 0 || totals.protein > 0) && (
                <p className="num text-[13px] text-muted">
                  {totals.kcal > 0 && <>{totals.kcal} קל׳</>}
                  {totals.kcal > 0 && totals.protein > 0 && ' · '}
                  {totals.protein > 0 && <>{totals.protein} ח׳</>}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-3">
              {day.meals.map((meal, index) => (
                <li key={meal.id}>
                  <MealCard
                    meal={meal}
                    tint={tintFor(meal.id, index)}
                    open={openMeal === meal.id}
                    onToggle={() => {
                      haptic('select');
                      setOpenMeal(openMeal === meal.id ? null : meal.id);
                    }}
                    onChange={(patch) => patchMeal(day.id, meal.id, patch)}
                    onRemove={() => removeMeal(day.id, meal.id)}
                  />
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => addMeal(day.id)}
              className="mt-3 flex h-13 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-card text-[14.5px] font-medium text-ink-soft shadow-[var(--shadow-soft)]"
            >
              <Plus size={16} weight="bold" />
              ארוחה נוספת
            </button>
          </section>
        );
      })}

      <Button block size="lg" variant="danger" onClick={onRemove}>
        <Trash size={16} weight="bold" />
        מחיקת התפריט
      </Button>
    </div>
  );
}

function MealCard({
  meal,
  tint,
  open,
  onToggle,
  onChange,
  onRemove,
}: {
  meal: Meal;
  tint: ReturnType<typeof tintFor>;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Meal>) => void;
  onRemove: () => void;
}) {
  const totals = mealTotals(meal);
  const filled = meal.items.filter((i) => i.text.trim()).length;

  const patchItem = (id: string, patch: Partial<MealItem>) =>
    onChange({ items: meal.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-soft)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-4 text-start"
      >
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-[var(--radius-sm)] ${TINT_BG[tint]}`}
        >
          <ForkKnife size={19} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-medium">{meal.name}</span>
          <span className="num mt-0.5 block text-[12.5px] text-muted">
            {meal.time && <>{meal.time} · </>}
            {filled ? `${filled} פריטים` : 'ריק'}
            {totals.kcal > 0 && <> · {totals.kcal} קל׳</>}
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
            <div className="flex flex-col gap-4 border-t border-line p-4">
              <div className="flex gap-3">
                <input
                  value={meal.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  aria-label="שם הארוחה"
                  className="min-w-0 flex-1 rounded-[var(--radius-sm)] bg-canvas px-4 py-3 text-[15px] font-medium outline-none"
                />
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-canvas px-3">
                  <Clock size={15} weight="bold" className="shrink-0 text-faint" />
                  <input
                    value={meal.time ?? ''}
                    onChange={(e) => onChange({ time: e.target.value })}
                    placeholder="07:30"
                    aria-label="שעה"
                    className="num w-14 bg-transparent text-[14px] outline-none placeholder:text-faint"
                  />
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {meal.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <input
                      value={item.text}
                      onChange={(e) => patchItem(item.id, { text: e.target.value })}
                      placeholder="למשל 3 ביצים + פרוסת לחם מלא"
                      aria-label="פריט בארוחה"
                      className="min-w-0 flex-1 rounded-[var(--radius-sm)] bg-canvas px-4 py-3 text-[14.5px] outline-none placeholder:text-faint"
                    />
                    <input
                      value={item.kcal ?? ''}
                      onChange={(e) =>
                        patchItem(item.id, { kcal: Number(e.target.value) || undefined })
                      }
                      inputMode="numeric"
                      placeholder="קל׳"
                      aria-label="קלוריות"
                      className="num w-16 shrink-0 rounded-[var(--radius-sm)] bg-canvas px-2 py-3 text-center text-[14px] outline-none placeholder:text-faint"
                    />
                    <IconButton
                      label="הסרת הפריט"
                      size="sm"
                      tone="bare"
                      onClick={() => {
                        haptic('tap');
                        onChange({ items: meal.items.filter((i) => i.id !== item.id) });
                      }}
                    >
                      <X size={15} weight="bold" />
                    </IconButton>
                  </li>
                ))}
              </ul>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    haptic('tap');
                    onChange({ items: [...meal.items, newItem()] });
                  }}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-canvas text-[14px] font-medium text-ink-soft"
                >
                  <Plus size={15} weight="bold" />
                  פריט
                </button>
                <IconButton label={`הסרת ${meal.name}`} size="sm" tone="card" onClick={onRemove}>
                  <Trash size={15} weight="bold" />
                </IconButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
