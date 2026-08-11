'use client';

import { motion, useReducedMotion } from 'motion/react';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr';
import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/button';

/**
 * Every screen enters with the same short rise. Consistency here is what makes
 * navigation feel like one app rather than a set of pages.
 */
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
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto w-full max-w-[560px] px-4 ${className}`}
    >
      {children}
    </motion.main>
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
  action?: React.ReactNode;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="flex items-start gap-3 pt-3 pb-5">
      {back && (
        <IconButton label="חזרה" onClick={() => router.back()} className="-ms-1 mt-0.5">
          {/* The caret points back, which is rightward in an RTL layout. */}
          <CaretLeft size={18} weight="bold" className="flip-rtl" />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[26px] leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
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
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[17px]">{children}</h2>
      {action}
    </div>
  );
}
