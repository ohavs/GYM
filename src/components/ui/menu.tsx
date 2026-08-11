'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CaretDown, Check } from '@phosphor-icons/react/dist/ssr';
import { haptic } from '@/lib/haptics';

/**
 * Anchored dropdown menu, in the same pill language as the chips it replaces.
 *
 * The panel is positioned against the trigger rather than the viewport, so it
 * follows the sticky header without measuring anything: the header carries a
 * backdrop filter, which makes it the containing block for fixed children and
 * would strand a viewport-anchored panel behind it.
 *
 * Options are checkable and stay checkable — the menu never closes on a pick,
 * because choosing three areas to browse should cost three taps, not six.
 */
export function Dropdown({
  label,
  title,
  count = 0,
  onClear,
  footer,
  children,
}: {
  /** Trigger text. Usually the single selection, or the group name. */
  label: string;
  /** Heading inside the panel. */
  title: string;
  count?: number;
  onClear?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    // Capture phase, so a tap that lands on another control closes the menu
    // before that control acts on it.
    const onDown = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = count > 0;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <motion.button
        type="button"
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          haptic('select');
          setOpen((v) => !v);
        }}
        className={[
          'inline-flex h-11 max-w-[62vw] items-center gap-1.5 rounded-full px-4.5 text-[14px] font-medium',
          'transition-colors duration-150',
          active ? 'bg-ink text-white' : 'bg-card text-ink-soft shadow-[var(--shadow-soft)]',
        ].join(' ')}
      >
        <span className="truncate">{label}</span>
        {active && (
          <span className="digits grid size-5 shrink-0 place-items-center rounded-full bg-white/20 text-[11px] font-semibold text-white">
            {count}
          </span>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="shrink-0"
        >
          <CaretDown size={13} weight="bold" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
            style={{ transformOrigin: 'top right' }}
            className={[
              'absolute start-0 top-full z-30 mt-2.5 flex w-[280px] max-w-[calc(100vw-40px)] flex-col',
              'overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-pop)]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
              <p className="text-[13px] font-medium text-faint">{title}</p>
              {active && onClear && (
                <button
                  type="button"
                  onClick={() => {
                    haptic('tap');
                    onClear();
                  }}
                  className="text-[13px] font-medium text-muted"
                >
                  ניקוי
                </button>
              )}
            </div>

            {/* Height lands mid-row and the bottom edge fades, so a list with
                more in it never looks like it ended at the last visible line. */}
            <div
              className="no-scrollbar min-h-0 max-h-[min(19.5rem,42vh)] flex-1 overflow-y-auto overscroll-contain px-2 pb-2"
              style={{
                maskImage: 'linear-gradient(to bottom, #000 calc(100% - 22px), transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, #000 calc(100% - 22px), transparent)',
              }}
            >
              {children}
            </div>

            {footer && <div className="border-t border-line px-2 py-2">{footer}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One checkable row. Sized for a thumb, not a cursor. */
export function MenuItem({
  selected,
  onClick,
  leading,
  label,
  count,
}: {
  selected?: boolean;
  onClick: () => void;
  leading?: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <motion.button
      type="button"
      role="menuitemcheckbox"
      aria-checked={Boolean(selected)}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={() => {
        haptic('select');
        onClick();
      }}
      className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] p-2 text-start transition-colors ${
        selected ? 'bg-canvas' : ''
      }`}
    >
      {leading}
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{label}</span>
      {count !== undefined && <span className="digits text-[12px] text-faint">{count}</span>}
      {/* A square box, not a circle: it says several of these can be on at
          once. The theme's radius scale starts at 12px, which would round a
          24px box away completely, so this one is set outright. */}
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-[8px] transition-colors ${
          selected ? 'bg-ink text-white' : 'border-[1.5px] border-line-strong'
        }`}
      >
        {selected && <Check size={13} weight="bold" />}
      </span>
    </motion.button>
  );
}

/** Plain action row for the panel's footer. */
export function MenuAction({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        haptic('tap');
        onClick();
      }}
      className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2.5 text-start text-[14px] font-medium text-ink-soft"
    >
      {icon}
      {children}
    </button>
  );
}
