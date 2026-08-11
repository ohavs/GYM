'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react';
import { X } from '@phosphor-icons/react/dist/ssr';
import { IconButton } from './button';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  full?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Bottom sheet with drag-to-dismiss. Sheets are the modal surface on mobile:
 * the thumb reaches the handle and the page stays visible behind.
 *
 * The sheet can be pulled down from anywhere on it, not only the handle, which
 * means the drag gesture and the content's own scrolling compete for the same
 * downward swipe. They are separated by intent rather than by region:
 *
 *   - Motion's automatic listener is off; the drag is started by hand.
 *   - Inside the scrolling body, a pull only becomes a drag once the content is
 *     already scrolled to the top and the finger has clearly travelled down.
 *     Anywhere mid-scroll, the swipe stays a scroll and the sheet ignores it.
 *   - The handle and header start the drag immediately, since nothing there
 *     scrolls.
 */
export function Sheet({ open, onClose, title, subtitle, full, children, footer }: Props) {
  const reduce = useReducedMotion();
  const dragControls = useDragControls();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pull = useRef<{ y: number; claimed: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  /** Distance the finger must travel down before a scroll becomes a dismissal. */
  const CLAIM_AT = 12;

  const bodyGestures = reduce
    ? {}
    : {
        onPointerDown: (e: React.PointerEvent) => {
          pull.current = { y: e.clientY, claimed: false };
        },
        onPointerMove: (e: React.PointerEvent) => {
          const gesture = pull.current;
          if (!gesture || gesture.claimed) return;
          // Anything left to scroll up wins the gesture.
          if ((scrollRef.current?.scrollTop ?? 0) > 0) return;
          if (e.clientY - gesture.y < CLAIM_AT) return;
          gesture.claimed = true;
          dragControls.start(e);
        },
        onPointerUp: () => {
          pull.current = null;
        },
        onPointerCancel: () => {
          pull.current = null;
        },
      };

  const grabGestures = reduce
    ? {}
    : { onPointerDown: (e: React.PointerEvent) => dragControls.start(e) };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.button
            type="button"
            aria-label="סגירה"
            className="absolute inset-0 bg-ink/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={[
              'relative flex w-full flex-col overflow-hidden bg-canvas',
              'rounded-t-[var(--radius-xl)] shadow-[0_-16px_50px_-20px_rgba(22,22,26,0.4)]',
              full ? 'h-[93dvh]' : 'max-h-[88dvh]',
            ].join(' ')}
            // Vertical panning stays with the browser so the body keeps its
            // native scrolling; the drag is started explicitly instead.
            style={{ touchAction: 'pan-y' }}
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.85 }}
            drag={reduce ? false : 'y'}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              pull.current = null;
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
          >
            <div {...grabGestures} className="shrink-0 cursor-grab active:cursor-grabbing">
              <div className="flex justify-center pt-3.5 pb-1">
                <span className="h-1.5 w-12 rounded-full bg-line-strong" />
              </div>

              {(title || subtitle) && (
                <header className="flex items-start gap-3 px-6 pt-2 pb-4">
                  <div className="min-w-0 flex-1">
                    {title && <h2 className="truncate text-[24px]">{title}</h2>}
                    {subtitle && <p className="mt-1 truncate text-[14px] text-muted">{subtitle}</p>}
                  </div>
                  <IconButton label="סגירה" size="sm" onClick={onClose} tone="card">
                    <X size={17} weight="bold" />
                  </IconButton>
                </header>
              )}
            </div>

            <div
              ref={scrollRef}
              {...bodyGestures}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2"
            >
              {children}
            </div>

            {footer && (
              <div className="bg-canvas px-5 pt-4 pb-[max(env(safe-area-inset-bottom),18px)]">
                {footer}
              </div>
            )}
            {!footer && <div className="pb-[max(env(safe-area-inset-bottom),18px)]" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
