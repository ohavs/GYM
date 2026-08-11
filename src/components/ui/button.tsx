'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { haptic } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-[0_6px_20px_-10px_var(--accent)]',
  secondary: 'bg-surface-2 text-text border border-line',
  ghost: 'bg-transparent text-muted border border-transparent',
  danger: 'bg-bad-wash text-bad border border-bad/25',
};

const SIZES: Record<Size, string> = {
  sm: 'h-10 px-4 text-[14px] gap-1.5',
  md: 'h-12 px-5 text-[15px] gap-2',
  lg: 'h-14 px-6 text-[17px] gap-2.5',
};

type Props = Omit<HTMLMotionProps<'button'>, 'ref'> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', block, loading, className = '', children, onClick, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.965 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      disabled={disabled || loading}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={[
        'relative inline-flex items-center justify-center rounded-full font-semibold',
        'transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none',
        'select-none whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner />
          <span className="opacity-80">רגע...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
});

function Spinner() {
  return (
    <motion.span
      aria-hidden
      className="block size-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/** Circular icon button used in headers and media overlays. */
export function IconButton({
  label,
  className = '',
  tone = 'surface',
  onClick,
  children,
  ...rest
}: Omit<HTMLMotionProps<'button'>, 'ref'> & {
  label: string;
  tone?: 'surface' | 'glass' | 'accent';
}) {
  const tones = {
    surface: 'bg-surface-2 text-text border border-line',
    glass: 'bg-black/45 text-white backdrop-blur-md border border-white/12',
    accent: 'bg-accent text-accent-ink border border-transparent',
  };
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={`grid size-11 shrink-0 place-items-center rounded-full ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
