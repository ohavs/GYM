'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Minus, Plus, MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr';
import { haptic } from '@/lib/haptics';
import { clamp } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Chip                                                                */
/* ------------------------------------------------------------------ */

export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      onClick={() => {
        haptic('select');
        onClick?.();
      }}
      aria-pressed={active}
      className={[
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold',
        'border transition-colors duration-150',
        active
          ? 'border-accent-line bg-accent-wash text-accent'
          : 'border-line bg-surface-2 text-muted',
      ].join(' ')}
    >
      {children}
      {count !== undefined && (
        <span className={`num text-[11px] ${active ? 'text-accent/70' : 'text-faint'}`}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={`grid gap-1 rounded-full border border-line bg-surface-2 p-1 ${
        size === 'sm' ? 'h-10' : 'h-12'
      }`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => {
              haptic('select');
              onChange(option.value);
            }}
            className="relative rounded-full text-[14px] font-semibold"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                className="absolute inset-0 rounded-full bg-accent"
              />
            )}
            <span className={`relative z-10 ${active ? 'text-accent-ink' : 'text-muted'}`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Option rows (radio and multi-select)                                */
/* ------------------------------------------------------------------ */

export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 480, damping: 32 }}
      onClick={() => {
        haptic('select');
        onSelect();
      }}
      aria-pressed={selected}
      className={[
        'flex w-full items-center gap-3.5 rounded-[var(--radius-card)] border p-4 text-start',
        'transition-colors duration-150',
        selected ? 'border-accent-line bg-accent-wash' : 'border-line bg-surface',
      ].join(' ')}
    >
      {icon && (
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
            selected ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted'
          }`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        {description && (
          <span className="mt-0.5 block truncate text-[13px] text-muted">{description}</span>
        )}
      </span>
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          selected ? 'border-accent bg-accent text-accent-ink' : 'border-line'
        }`}
      >
        {selected && <Check size={13} weight="bold" />}
      </span>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic('select');
        onChange(!checked);
      }}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-accent' : 'bg-surface-3'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 620, damping: 34 }}
        className="absolute top-1 size-5 rounded-full bg-white shadow-sm"
        style={checked ? { left: 4 } : { right: 4 }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Text field                                                          */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus,
  maxLength,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-semibold text-text">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoFocus={autoFocus}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'h-13 w-full rounded-[var(--radius-field)] border bg-surface px-4 py-3.5',
          'text-[16px] text-text placeholder:text-faint',
          'outline-none transition-colors duration-150',
          error ? 'border-bad' : 'border-line focus:border-accent-line',
        ].join(' ')}
      />
      {error ? (
        <p className="text-[13px] text-bad">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search field                                                        */
/* ------------------------------------------------------------------ */

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex items-center">
      <MagnifyingGlass
        size={18}
        weight="bold"
        className="pointer-events-none absolute start-4 text-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-full border border-line bg-surface ps-11 pe-11 text-[16px] text-text outline-none transition-colors placeholder:text-faint focus:border-accent-line [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="ניקוי חיפוש"
          onClick={() => onChange('')}
          className="absolute end-3 grid size-7 place-items-center rounded-full bg-surface-3 text-muted"
        >
          <X size={13} weight="bold" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                             */
/* ------------------------------------------------------------------ */

/**
 * Number entry for weight and reps. The buttons step (holding accelerates) and
 * the value itself is typeable, so jumping from 0 to 80 kg is one keyboard
 * entry rather than thirty-two taps.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  compact = false,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  compact?: boolean;
  label?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const bump = (dir: 1 | -1) => {
    haptic('tap');
    onChange(clamp(Math.round((value + dir * step) * 100) / 100, min, max));
  };

  const commit = () => {
    if (draft !== null) {
      const parsed = Number(draft.replace(',', '.'));
      onChange(Number.isFinite(parsed) ? clamp(parsed, min, max) : value);
    }
    setDraft(null);
  };

  const shown = draft ?? (Number.isInteger(value) ? String(value) : value.toFixed(1));

  return (
    <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
      <StepButton label="הפחתה" compact={compact} onPress={() => bump(-1)} onHold={() => bump(-1)}>
        <Minus size={compact ? 13 : 15} weight="bold" />
      </StepButton>
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        value={shown}
        onFocus={(e) => {
          setDraft(shown);
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={`num rounded-lg bg-transparent text-center font-bold text-text outline-none focus:bg-surface-3 ${
          compact ? 'w-11 text-[16px]' : 'w-14 text-[17px]'
        }`}
      />
      <StepButton label="הוספה" compact={compact} onPress={() => bump(1)} onHold={() => bump(1)}>
        <Plus size={compact ? 13 : 15} weight="bold" />
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  onPress,
  onHold,
  compact,
  children,
}: {
  label: string;
  onPress: () => void;
  onHold: () => void;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    if (repeat.current) clearInterval(repeat.current);
    timer.current = null;
    repeat.current = null;
  };

  useEffect(() => clear, []);

  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      onPointerDown={() => {
        onPress();
        timer.current = setTimeout(() => {
          repeat.current = setInterval(onHold, 80);
        }, 420);
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      className={`grid shrink-0 place-items-center rounded-full bg-surface-3 text-text ${
        compact ? 'size-8' : 'size-9'
      }`}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Slider                                                              */
/* ------------------------------------------------------------------ */

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  format?: (value: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const id = useId();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[14px] font-semibold">
          {label}
        </label>
        <span className="num text-[15px] font-bold text-accent">
          {format ? format(value) : value}
        </span>
      </div>
      <div className="relative h-9">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-3" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ insetInlineStart: 0, width: `${pct}%` }}
        />
        <span
          className="pointer-events-none absolute top-1/2 size-6 -translate-y-1/2 rounded-full border-[3px] border-accent bg-bg shadow-sm"
          style={{ insetInlineStart: `calc(${pct}% - 12px)` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            haptic('tap');
            onChange(Number(e.target.value));
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Progress ring                                                       */
/* ------------------------------------------------------------------ */

export function ProgressRing({
  progress,
  size = 72,
  stroke = 7,
  children,
  tone = 'accent',
}: {
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  tone?: 'accent' | 'ok';
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = clamp(progress, 0, 1);

  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === 'ok' ? 'var(--ok)' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-surface-2 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-l from-transparent via-white/[0.045] to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-3xl border border-line bg-surface-2 text-faint">
        {icon}
      </span>
      <h3 className="mt-1 text-[17px]">{title}</h3>
      <p className="max-w-[34ch] text-[14px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export function Stat({
  value,
  label,
  tone = 'default',
  numeric = false,
}: {
  value: string;
  label: string;
  tone?: 'default' | 'accent';
  /** Set when the value is digits and separators only, with no Hebrew in it. */
  numeric?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`${numeric ? 'digits' : 'num'} text-[22px] font-bold leading-none ${
          tone === 'accent' ? 'text-accent' : 'text-text'
        }`}
      >
        {value}
      </span>
      <span className="text-[12px] text-muted">{label}</span>
    </div>
  );
}

export function useDebounced<T>(value: T, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
