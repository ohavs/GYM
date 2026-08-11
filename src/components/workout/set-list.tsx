'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowUUpLeft, Check, Minus, Plus } from '@phosphor-icons/react/dist/ssr';
import { Button, IconButton } from '@/components/ui/button';
import { Stepper } from '@/components/ui/controls';
import { haptic } from '@/lib/haptics';
import type { Block, LoggedSet } from '@/lib/types';

/**
 * One set is open at a time.
 *
 * Cramming a set number, a weight stepper, a reps stepper and a confirm button
 * onto a single phone-width row leaves every control too small to hit and
 * overflows the card. Here the set being worked on expands to full-width
 * controls, and the rest collapse to a one-line record of what was lifted.
 */
export function SetList({
  sets,
  block,
  activeIndex,
  onActivate,
  onUpdate,
  onComplete,
  onAdd,
  onRemove,
}: {
  sets: LoggedSet[];
  block: Block;
  activeIndex: number;
  onActivate: (index: number) => void;
  onUpdate: (index: number, patch: Partial<LoggedSet>) => void;
  onComplete: (index: number) => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {sets.map((set, index) => {
        const open = index === activeIndex && !set.done;

        if (open) {
          return (
            <motion.div
              key={index}
              layout
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="overflow-hidden rounded-[var(--radius-lg)] bg-card p-5 shadow-[var(--shadow-pop)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[17px] font-medium">
                  סט <span className="num">{index + 1}</span>
                </p>
                <p className="num text-[13px] text-faint">
                  מתוך {sets.length} · יעד {block.reps}
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 flex flex-col gap-2.5"
              >
                <Dial
                  label="משקל"
                  unit="ק״ג"
                  value={set.weight}
                  step={2.5}
                  max={500}
                  onChange={(weight) => onUpdate(index, { weight })}
                />
                <Dial
                  label="חזרות"
                  value={set.reps}
                  step={1}
                  max={100}
                  onChange={(reps) => onUpdate(index, { reps })}
                />
              </motion.div>

              <Button
                block
                size="lg"
                className="mt-5"
                onClick={() => onComplete(index)}
              >
                <Check size={18} weight="bold" />
                סיימתי את הסט
              </Button>
            </motion.div>
          );
        }

        return (
          <motion.button
            key={index}
            layout
            type="button"
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={() => {
              haptic('select');
              onActivate(index);
            }}
            className={`flex w-full items-center gap-4 rounded-[var(--radius-md)] px-4 py-3.5 text-start transition-colors ${
              set.done ? 'bg-mint' : 'bg-card shadow-[var(--shadow-soft)]'
            }`}
          >
            <span
              className={`num grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-semibold ${
                set.done ? 'bg-ink text-on-ink' : 'bg-canvas text-muted'
              }`}
            >
              {set.done ? <Check size={16} weight="bold" /> : index + 1}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">
                סט <span className="num">{index + 1}</span>
              </span>
              <span className="num block text-[12.5px] text-muted">
                {set.done ? 'הושלם' : 'ממתין'}
              </span>
            </span>

            <span className="num shrink-0 text-[15px] font-medium">
              {set.weight > 0 ? `${set.weight} ק״ג` : 'משקל גוף'}
              <span className="mx-1.5 text-faint">×</span>
              {set.reps}
            </span>

            {set.done && (
              <span className="shrink-0 text-on-tint/35">
                <ArrowUUpLeft size={15} weight="bold" className="flip-rtl" />
              </span>
            )}
          </motion.button>
        );
      })}

      <div className="mt-1 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            haptic('tap');
            onAdd();
          }}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-card text-[14px] font-medium text-ink-soft shadow-[var(--shadow-soft)]"
        >
          <Plus size={15} weight="bold" />
          סט נוסף
        </button>
        {sets.length > 1 && (
          <IconButton
            label="הסרת הסט האחרון"
            onClick={() => {
              haptic('tap');
              onRemove();
            }}
          >
            <Minus size={15} weight="bold" />
          </IconButton>
        )}
      </div>
    </div>
  );
}

/**
 * One control per row rather than two side by side: at phone width a pair of
 * columns leaves the buttons narrower than a fingertip and pushes them past the
 * tile's edge. The buttons are white on the tile's tinted ground, since
 * matching the backdrop made them read as bites out of the box.
 */
function Dial({
  label,
  unit,
  value,
  onChange,
  step,
  max,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-canvas px-4 py-3">
      <span className="text-[14px] font-medium">
        {label}
        {unit && <span className="ms-1 text-[12px] text-faint">{unit}</span>}
      </span>
      <Stepper
        value={value}
        onChange={onChange}
        step={step}
        max={max}
        size="lg"
        on="canvas"
        label={label}
      />
    </div>
  );
}

export { AnimatePresence };
