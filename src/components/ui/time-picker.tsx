'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Clock } from '@phosphor-icons/react/dist/ssr';
import { Button } from './button';
import { Sheet } from './sheet';
import { haptic } from '@/lib/haptics';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const ROW = 52;

function split(value: string | undefined) {
  const [h = '08', m = '00'] = (value ?? '').split(':');
  const hour = HOURS.includes(h) ? h : '08';
  // Snap to the nearest five, since that is the resolution offered.
  const minute = MINUTES.includes(m)
    ? m
    : MINUTES.reduce((best, option) =>
        Math.abs(+option - +m) < Math.abs(+best - +m) ? option : best,
      );
  return { hour, minute };
}

/**
 * Time of day, as two snapping columns.
 *
 * A text field made people type a colon and let them write "7" or "25:00"; the
 * native control is a different widget on every platform and cannot be made to
 * match anything. Two columns that snap under a thumb is the shape everyone
 * already knows from their phone, and it can only produce a real time.
 */
export function TimePicker({
  value,
  onChange,
  label = 'שעה',
}: {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const start = split(value);
  const [hour, setHour] = useState(start.hour);
  const [minute, setMinute] = useState(start.minute);

  // Each opening starts from the value as it stands now, reset during render
  // so the sheet never shows the previous session's scroll position.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      const fresh = split(value);
      setHour(fresh.hour);
      setMinute(fresh.minute);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic('select');
          setOpen(true);
        }}
        aria-label={`${label}${value ? `, ${value}` : ''}`}
        className="flex h-13 shrink-0 items-center gap-2 rounded-[var(--radius-sm)] bg-canvas px-4"
      >
        <Clock size={16} weight="bold" className="shrink-0 text-faint" />
        <span className={`digits text-[15px] font-medium ${value ? '' : 'text-faint'}`}>
          {value || '--:--'}
        </span>
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        footer={
          <div className="flex gap-3">
            <Button variant="card" size="lg" className="flex-1" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button
              size="lg"
              className="flex-[2]"
              onClick={() => {
                haptic('success');
                onChange(`${hour}:${minute}`);
                setOpen(false);
              }}
            >
              קביעת השעה
            </Button>
          </div>
        }
      >
        <div className="py-2">
          <p className="digits mb-5 text-center text-[42px] font-semibold leading-none">
            {hour}:{minute}
          </p>

          {/* Hours on the right, minutes on the left, as a clock reads in an
              RTL layout: the larger unit leads. */}
          <div className="relative flex gap-3">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 h-13 -translate-y-1/2 rounded-[var(--radius-sm)] bg-card shadow-[var(--shadow-soft)]"
            />
            <Column values={HOURS} value={hour} onChange={setHour} label="שעה" />
            <Column values={MINUTES} value={minute} onChange={setMinute} label="דקות" />
          </div>
        </div>
      </Sheet>
    </>
  );
}

function Column({
  values,
  value,
  onChange,
  label,
}: {
  values: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Centre the current value when the column appears.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const index = values.indexOf(value);
    if (index >= 0) node.scrollTop = index * ROW;
    // Only on mount: afterwards the scroll position is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      onScroll={() => {
        const node = ref.current;
        if (!node) return;
        if (settle.current) clearTimeout(settle.current);
        settle.current = setTimeout(() => {
          const index = Math.round(node.scrollTop / ROW);
          const next = values[Math.min(Math.max(index, 0), values.length - 1)];
          if (next && next !== value) {
            haptic('tap');
            onChange(next);
          }
        }, 90);
      }}
      className="no-scrollbar relative h-[156px] flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain"
      style={{ scrollPaddingBlock: ROW }}
    >
      {/* Spacers let the first and last value reach the centre band. */}
      <div style={{ height: ROW }} />
      {values.map((option) => (
        <div
          key={option}
          role="option"
          aria-selected={option === value}
          className="flex snap-center items-center justify-center"
          style={{ height: ROW }}
        >
          <motion.span
            animate={{
              opacity: option === value ? 1 : 0.32,
              scale: option === value ? 1 : 0.86,
            }}
            transition={{ duration: 0.18 }}
            className="digits text-[24px] font-semibold"
          >
            {option}
          </motion.span>
        </div>
      ))}
      <div style={{ height: ROW }} />
    </div>
  );
}
