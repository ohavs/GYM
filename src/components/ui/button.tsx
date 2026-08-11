'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { haptic } from '@/lib/haptics';

type Variant = 'ink' | 'card' | 'tint' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  ink: 'bg-ink text-on-ink',
  card: 'bg-card text-ink shadow-[var(--shadow-soft)]',
  tint: 'bg-lilac text-ink',
  quiet: 'bg-transparent text-muted',
  danger: 'bg-blush text-red',
};

const SIZES: Record<Size, string> = {
  sm: 'h-11 px-5 text-[14px] gap-1.5',
  md: 'h-13 px-6 text-[15px] gap-2',
  lg: 'h-15 px-7 text-[16px] gap-2.5',
};

type Props = Omit<HTMLMotionProps<'button'>, 'ref'> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = 'ink',
    size = 'md',
    block,
    loading,
    className = '',
    children,
    onClick,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.955 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={[
        'relative inline-flex select-none items-center justify-center whitespace-nowrap',
        'rounded-full font-medium transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        block ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Spinner /> : children}
    </motion.button>
  );
});

function Spinner() {
  return (
    <motion.span
      aria-label="טוען"
      className="block size-4 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/**
 * Circular control. The mockup leans on these for every secondary action, so
 * they carry real presence: 48px by default with a soft card lift.
 */
export function IconButton({
  label,
  className = '',
  tone = 'card',
  size = 'md',
  onClick,
  children,
  ...rest
}: Omit<HTMLMotionProps<'button'>, 'ref'> & {
  label: string;
  tone?: 'card' | 'ink' | 'tint' | 'bare';
  size?: 'sm' | 'md' | 'lg';
}) {
  const tones = {
    card: 'bg-card text-ink shadow-[var(--shadow-soft)]',
    ink: 'bg-ink text-on-ink',
    tint: 'bg-lilac text-ink',
    bare: 'bg-transparent text-muted',
  };
  const sizes = { sm: 'size-10', md: 'size-12', lg: 'size-14' };

  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={(e) => {
        haptic('tap');
        onClick?.(e);
      }}
      className={`grid shrink-0 place-items-center rounded-full ${tones[tone]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
