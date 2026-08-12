'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretDown, MagnifyingGlass, Plus, Star, X } from '@phosphor-icons/react/dist/ssr';
import { useStore } from '@/lib/store';
import {
  allFoods,
  CATEGORY_LABEL,
  foodLabel,
  groupFoods,
  isNewFood,
  searchFoods,
  type Food,
} from '@/lib/foods';
import { haptic } from '@/lib/haptics';

/**
 * Picking a food, or writing one that is not on the list.
 *
 * It expands in place rather than floating above: the editor already lives
 * inside a scrolling sheet, and an anchored panel there gets clipped by the
 * scroll container at exactly the moment it needs the room. Opening inline
 * gives the search field and the list the full width of the card.
 */
export function FoodPicker({
  open,
  onOpenChange,
  onPick,
  draftText,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (food: { text: string; kcal?: number; protein?: number }) => void;
  /** What is typed in the row right now, offered as a new entry. */
  draftText: string;
}) {
  const custom = useStore((s) => s.foods);
  const addFood = useStore((s) => s.addFood);
  const [query, setQuery] = useState('');

  const foods = useMemo(() => allFoods(custom), [custom]);
  const groups = useMemo(() => groupFoods(searchFoods(foods, query)), [foods, query]);
  const canAdd = isNewFood(foods, query || draftText);
  const newName = (query || draftText).trim();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="mt-3 rounded-[var(--radius-md)] bg-canvas p-3">
            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-card px-3.5 shadow-[var(--shadow-soft)]">
              <MagnifyingGlass size={16} weight="bold" className="shrink-0 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש מאכל"
                aria-label="חיפוש מאכל"
                className="h-12 min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-faint"
              />
              {query && (
                <button
                  type="button"
                  aria-label="ניקוי החיפוש"
                  onClick={() => setQuery('')}
                  className="shrink-0 text-faint"
                >
                  <X size={15} weight="bold" />
                </button>
              )}
            </div>

            {canAdd && (
              <button
                type="button"
                onClick={() => {
                  haptic('select');
                  onPick({ text: newName });
                  onOpenChange(false);
                  setQuery('');
                }}
                className="mt-2.5 flex w-full items-center gap-3 rounded-[var(--radius-sm)] bg-mint p-3 text-start"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint-well">
                  <Plus size={16} weight="bold" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium">
                  שימוש ב״{newName}״
                </span>
              </button>
            )}

            <div className="no-scrollbar mt-2.5 max-h-[248px] overflow-y-auto overscroll-contain">
              {groups.length === 0 && !canAdd && (
                <p className="py-6 text-center text-[13.5px] text-muted">
                  לא מצאנו מאכל כזה. אפשר להקליד אותו ולהוסיף.
                </p>
              )}

              {groups.map((group) => (
                <section key={group.category} className="mb-2 last:mb-0">
                  <h4 className="px-1 pt-2 pb-1.5 text-[12px] font-semibold text-faint">
                    {group.label}
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {group.items.map((food) => (
                      <li key={food.id}>
                        <FoodRow
                          food={food}
                          onPick={() => {
                            haptic('select');
                            onPick({
                              text: foodLabel(food),
                              kcal: food.kcal || undefined,
                              protein: food.protein,
                            });
                            onOpenChange(false);
                            setQuery('');
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {canAdd && newName && (
              <button
                type="button"
                onClick={() => {
                  haptic('success');
                  addFood({
                    id: `own-${Date.now()}`,
                    name: newName,
                    amount: '',
                    kcal: 0,
                    category: 'snack',
                  });
                  setQuery('');
                }}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-medium text-muted"
              >
                <Star size={14} weight="bold" />
                הוספת ״{newName}״ למאגר שלי
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FoodRow({ food, onPick }: { food: Food; onPick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 480, damping: 30 }}
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] bg-card p-3 text-start shadow-[var(--shadow-soft)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium">
          {food.name}
          {food.custom && <Star size={11} weight="fill" className="ms-1.5 inline text-amber" />}
        </span>
        {food.amount && (
          <span className="block truncate text-[12px] text-muted">{food.amount}</span>
        )}
      </span>
      {food.kcal > 0 && (
        <span className="num shrink-0 text-[13px] font-medium text-muted">{food.kcal} קל׳</span>
      )}
    </motion.button>
  );
}

/** The trigger that sits beside a food field. */
export function FoodPickerButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label="בחירה ממאגר המאכלים"
      className="flex h-13 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] bg-canvas px-3.5 text-[13.5px] font-medium text-ink-soft"
    >
      מהמאגר
      <motion.span animate={{ rotate: open ? 180 : 0 }} className="shrink-0">
        <CaretDown size={14} weight="bold" />
      </motion.span>
    </button>
  );
}

export { CATEGORY_LABEL };
