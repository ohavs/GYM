'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { Check, MagnifyingGlass, Minus, Plus, X } from '@phosphor-icons/react/dist/ssr';
import { haptic } from '@/lib/haptics';
import { clamp } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Tint surfaces                                                       */
/* ------------------------------------------------------------------ */

export const TINTS = ['peach', 'mint', 'lilac', 'butter', 'sky', 'blush'] as const;
export type Tint = (typeof TINTS)[number];

export const TINT_BG: Record<Tint, string> = {
  peach: 'bg-peach',
  mint: 'bg-mint',
  lilac: 'bg-lilac',
  butter: 'bg-butter',
  sky: 'bg-sky',
  blush: 'bg-blush',
};

/** Selected state for a tinted surface: same hue, more of it. */
export const TINT_DEEP: Record<Tint, string> = {
  peach: 'bg-peach-deep',
  mint: 'bg-mint-deep',
  lilac: 'bg-lilac-deep',
  butter: 'bg-butter-deep',
  sky: 'bg-sky-deep',
  blush: 'bg-blush-deep',
};

/** Stable tint per key, so a given exercise always sits on the same colour. */
export function tintFor(key: string, offset = 0): Tint {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return TINTS[(hash + offset) % TINTS.length];
}

/* ------------------------------------------------------------------ */
/* Pill                                                                */
/* ------------------------------------------------------------------ */

/** Small label pill. The mockup floats these over artwork and inside cards. */
export function Pill({
  children,
  tone = 'card',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'card' | 'ink' | 'mint' | 'peach' | 'butter';
  className?: string;
}) {
  const tones = {
    card: 'bg-card text-ink',
    ink: 'bg-ink text-white',
    mint: 'bg-mint text-ink',
    peach: 'bg-peach text-ink',
    butter: 'bg-butter text-ink',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

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
      whileTap={{ scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={() => {
        haptic('select');
        onClick?.();
      }}
      aria-pressed={active}
      className={[
        'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4.5 text-[14px] font-medium',
        'transition-colors duration-150',
        active ? 'bg-ink text-white' : 'bg-card text-ink-soft shadow-[var(--shadow-soft)]',
      ].join(' ')}
    >
      {children}
      {count !== undefined && (
        <span className={`digits text-[11px] ${active ? 'text-white/55' : 'text-faint'}`}>
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
      className={`grid gap-1 rounded-full bg-card p-1.5 shadow-[var(--shadow-soft)] ${
        size === 'sm' ? 'h-12' : 'h-14'
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
            className="relative rounded-full text-[14px] font-medium"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={{ type: 'spring', stiffness: 460, damping: 38 }}
                className="absolute inset-0 rounded-full bg-ink"
              />
            )}
            <span className={`relative z-10 ${active ? 'text-white' : 'text-muted'}`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Option card                                                         */
/* ------------------------------------------------------------------ */

export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  tint = 'lilac',
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tint?: Tint;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 460, damping: 32 }}
      onClick={() => {
        haptic('select');
        onSelect();
      }}
      aria-pressed={selected}
      className={[
        'flex w-full items-center gap-4 rounded-[var(--radius-lg)] p-4 text-start',
        'transition-colors duration-200',
        selected ? 'bg-ink text-white' : 'bg-card text-ink shadow-[var(--shadow-soft)]',
      ].join(' ')}
    >
      {icon && (
        <span
          className={`grid size-13 shrink-0 place-items-center rounded-[var(--radius-sm)] ${
            selected ? 'bg-white/12 text-white' : `${TINT_BG[tint]} text-ink`
          }`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium">{title}</span>
        {description && (
          <span
            className={`mt-0.5 block truncate text-[13px] ${selected ? 'text-white/60' : 'text-muted'}`}
          >
            {description}
          </span>
        )}
      </span>
      <motion.span
        initial={false}
        animate={{ scale: selected ? 1 : 0.8, opacity: selected ? 1 : 0.35 }}
        transition={{ type: 'spring', stiffness: 500, damping: 26 }}
        className={`grid size-7 shrink-0 place-items-center rounded-full ${
          selected ? 'bg-white text-ink' : 'bg-canvas text-transparent'
        }`}
      >
        <Check size={14} weight="bold" />
      </motion.span>
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
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-250 ${
        checked ? 'bg-ink' : 'bg-line-strong'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className="absolute top-1 size-6 rounded-full bg-white shadow-sm"
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
    <div className="flex flex-col gap-2.5">
      <label htmlFor={id} className="px-1 text-[14px] font-medium text-ink-soft">
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
          'h-15 w-full rounded-[var(--radius-md)] bg-card px-5 text-[17px] font-medium',
          'text-ink placeholder:font-normal placeholder:text-faint',
          'outline-none transition-shadow duration-200',
          error
            ? 'shadow-[0_0_0_2px_var(--red)]'
            : 'shadow-[var(--shadow-soft)] focus:shadow-[0_0_0_2px_var(--ink)]',
        ].join(' ')}
      />
      {error ? (
        <p className="px-1 text-[13px] text-red">{error}</p>
      ) : hint ? (
        <p className="px-1 text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

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
        size={19}
        weight="bold"
        className="pointer-events-none absolute start-5 text-faint"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-14 w-full rounded-full bg-card ps-13 pe-13 text-[15px] text-ink shadow-[var(--shadow-soft)] outline-none transition-shadow placeholder:text-faint focus:shadow-[0_0_0_2px_var(--ink)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="ניקוי חיפוש"
          onClick={() => onChange('')}
          className="absolute end-3.5 grid size-8 place-items-center rounded-full bg-canvas text-muted"
        >
          <X size={14} weight="bold" />
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
  size = 'md',
  /** Surface the stepper sits on, so its buttons never match their backdrop. */
  on = 'card',
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  compact?: boolean;
  size?: 'md' | 'lg';
  on?: 'card' | 'canvas';
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

  const big = size === 'lg';

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
      <StepButton label="הפחתה" compact={compact} big={big} on={on} onPress={() => bump(-1)} onHold={() => bump(-1)}>
        <Minus size={compact ? 13 : 16} weight="bold" />
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
        className={`num rounded-xl bg-transparent text-center font-semibold text-ink outline-none ${
          compact ? 'w-11 text-[17px]' : big ? 'w-[68px] text-[26px]' : 'w-16 text-[19px]'
        }`}
      />
      <StepButton label="הוספה" compact={compact} big={big} on={on} onPress={() => bump(1)} onHold={() => bump(1)}>
        <Plus size={compact ? 13 : 16} weight="bold" />
      </StepButton>
    </div>
  );
}

function StepButton({
  label,
  onPress,
  onHold,
  compact,
  big,
  on = 'card',
  children,
}: {
  label: string;
  onPress: () => void;
  onHold: () => void;
  compact?: boolean;
  big?: boolean;
  on?: 'card' | 'canvas';
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
      className={`grid shrink-0 place-items-center rounded-full text-ink-soft ${
        on === 'canvas' ? 'bg-card shadow-[var(--shadow-soft)]' : 'bg-canvas'
      } ${compact ? 'size-9' : 'size-11'}`}
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
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[15px] font-medium">
          {label}
        </label>
        <span className="num text-[28px] font-semibold leading-none">
          {format ? format(value) : value}
        </span>
      </div>
      <div className="relative h-11">
        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-canvas" />
        <div
          className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-ink"
          style={{ insetInlineStart: 0, width: `${pct}%` }}
        />
        <span
          className="pointer-events-none absolute top-1/2 size-8 -translate-y-1/2 rounded-full border-[5px] border-ink bg-white shadow-[var(--shadow-soft)]"
          style={{ insetInlineStart: `calc(${pct}% - 16px)` }}
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
  size = 76,
  stroke = 8,
  children,
  tone = 'ink',
}: {
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  tone?: 'ink' | 'green' | 'white';
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = clamp(progress, 0, 1);
  const colors = { ink: 'var(--ink)', green: 'var(--green)', white: '#ffffff' };

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === 'white' ? 'rgba(255,255,255,0.22)' : 'var(--line)'}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Counting number                                                     */
/* ------------------------------------------------------------------ */

/** Large metrics roll up on mount, so a number reads as something earned. */
export function CountUp({
  value,
  decimals = 0,
  className = '',
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const spring = useSpring(reduce ? value : 0, { stiffness: 60, damping: 18 });
  const text = useTransform(spring, (v) =>
    v.toLocaleString('he-IL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={`num ${className}`}>{text}</motion.span>;
}

/* ------------------------------------------------------------------ */
/* Skeleton and empty state                                            */
/* ------------------------------------------------------------------ */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-md)] bg-card ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-l from-transparent via-canvas to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  tint = 'lilac',
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  tint?: Tint;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <motion.span
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className={`grid size-20 place-items-center rounded-[var(--radius-lg)] ${TINT_BG[tint]} text-ink`}
      >
        {icon}
      </motion.span>
      <h3 className="mt-1 text-[20px]">{title}</h3>
      <p className="max-w-[32ch] text-[14px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat                                                                */
/* ------------------------------------------------------------------ */

export function Stat({
  value,
  label,
  numeric = false,
}: {
  value: string;
  label: string;
  /** Set when the value is digits and separators only, with no Hebrew in it. */
  numeric?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`${numeric ? 'digits' : 'num'} text-[26px] font-semibold leading-none`}>
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
