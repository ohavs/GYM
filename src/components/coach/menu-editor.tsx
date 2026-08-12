'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretDown, ForkKnife, Plus, Trash, X } from '@phosphor-icons/react/dist/ssr';
import { Button, IconButton } from '@/components/ui/button';
import { TINT_BG, tintFor } from '@/components/ui/controls';
import { TimePicker } from '@/components/ui/time-picker';
import { FoodPicker, FoodPickerButton } from '@/components/nutrition/food-picker';
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
import { plural } from '@/lib/format';
import { haptic } from '@/lib/haptics';

/**
 * The menu builder, used by a coach for a trainee and by a person for
 * themselves.
 *
 * An item can be picked from the food list or simply typed — the list is a
 * shortcut, never a gate, so anything a person actually eats can be written
 * down. The shape deliberately mirrors the program editor (day → meal → item,
 * against day → block → exercise) so the two halves of the app feel like one
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
        data-meal-head
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
            {filled ? `${filled} ${plural(filled, 'פריט', 'פריטים')}` : 'ריק'}
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
            <div className="flex flex-col gap-4 border-t border-line bg-canvas/40 p-4">
              <div className="flex gap-2.5">
                <input
                  value={meal.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  aria-label="שם הארוחה"
                  className="h-13 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-canvas px-4 text-[15px] font-medium outline-none"
                />
                <TimePicker value={meal.time} onChange={(time) => onChange({ time })} />
              </div>

              <ul className="flex flex-col gap-2.5">
                {meal.items.map((item) => (
                  <li key={item.id}>
                    <ItemCard
                      item={item}
                      onChange={(patch) => patchItem(item.id, patch)}
                      onRemove={() => {
                        haptic('tap');
                        onChange({ items: meal.items.filter((i) => i.id !== item.id) });
                      }}
                    />
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
                  className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-card text-[14px] font-medium text-ink-soft shadow-[var(--shadow-soft)]"
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

/**
 * One line of a meal, on a card of its own.
 *
 * Everything used to share a single row, which left the food — the one field
 * that holds a sentence — squeezed into a third of the screen. The name now
 * takes the full width and the numbers sit underneath it, where the row is
 * theirs to fill.
 */
function ItemCard({
  item,
  onChange,
  onRemove,
}: {
  item: MealItem;
  onChange: (patch: Partial<MealItem>) => void;
  onRemove: () => void;
}) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="rounded-[var(--radius-md)] bg-card p-3 shadow-[var(--shadow-soft)]">
      <div className="flex gap-2.5">
        <input
          value={item.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="מה אוכלים?"
          aria-label="פריט בארוחה"
          className="h-13 min-w-0 flex-1 rounded-[var(--radius-sm)] bg-canvas px-4 text-[14.5px] outline-none placeholder:text-faint"
        />
        <FoodPickerButton
          open={picking}
          onClick={() => {
            haptic('select');
            setPicking((v) => !v);
          }}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <NumberField
          value={item.kcal}
          onChange={(kcal) => onChange({ kcal })}
          label="קלוריות"
          unit="קל׳"
          max={4}
        />
        {/* Protein was already being filled in by the food list and shown in
            the day's totals, with nowhere to see or correct it. */}
        <NumberField
          value={item.protein}
          onChange={(protein) => onChange({ protein })}
          label="חלבון בגרמים"
          unit="חלבון"
          max={3}
        />
        <IconButton label="הסרת הפריט" size="sm" tone="bare" onClick={onRemove}>
          <X size={15} weight="bold" />
        </IconButton>
      </div>

      <FoodPicker
        open={picking}
        onOpenChange={setPicking}
        draftText={item.text}
        onPick={(food) => onChange({ text: food.text, kcal: food.kcal, protein: food.protein })}
      />
    </div>
  );
}

/** A figure and the unit it is in. Digits only, so it can only hold a number. */
function NumberField({
  value,
  onChange,
  label,
  unit,
  max,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
  label: string;
  unit: string;
  max: number;
}) {
  return (
    <div className="flex h-12 min-w-0 flex-1 items-center gap-1.5 rounded-[var(--radius-sm)] bg-canvas px-3.5">
      <input
        value={value ?? ''}
        // Stripping what cannot belong is friendlier than rejecting the
        // keystroke: nothing flashes, the field simply holds a number.
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, max);
          onChange(digits ? Number(digits) : undefined);
        }}
        inputMode="numeric"
        placeholder="—"
        aria-label={label}
        className="num w-9 min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-faint"
      />
      <span className="shrink-0 text-[12px] text-muted">{unit}</span>
    </div>
  );
}
