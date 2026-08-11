'use client';

import { motion, useReducedMotion } from 'motion/react';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

/** Children rise in sequence on entry, which is the app's one signature move. */
export function Screen({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.main
      initial={reduce ? false : 'hidden'}
      animate="shown"
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: 0.055, delayChildren: 0.02 } },
      }}
      className={`mx-auto w-full max-w-[520px] px-5 ${className}`}
    >
      {children}
    </motion.main>
  );
}

export const riseVariants = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Wraps a block so it joins the screen's entry sequence. */
export function Rise({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={riseVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  /** Extra control for the header's end. The theme switch sits beside it. */
  action?: React.ReactNode;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <motion.header variants={riseVariants} className="flex items-start gap-3 pt-4 pb-7">
      {back && (
        <IconButton label="חזרה" onClick={() => router.back()} className="-ms-1 mt-1">
          {/* The caret points back, which is rightward in an RTL layout. */}
          <CaretLeft size={19} weight="bold" className="flip-rtl" />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[32px] leading-[1.08]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {action}
        <ThemeToggle />
      </div>
    </motion.header>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 px-1">
      <h2 className="text-[20px]">{children}</h2>
      {action}
    </div>
  );
}
