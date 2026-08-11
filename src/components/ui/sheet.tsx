'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
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

/** Downward travel, in pixels, that turns a scroll into a dismissal. */
const CLAIM_AT = 10;
/** How far the sheet must be pulled, or how fast, to actually close. */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 0.55;

/**
 * Bottom sheet that can be pulled shut from anywhere on it.
 *
 * A downward swipe on the body is already a scroll, so the sheet and the
 * content compete for the same gesture. A drag library cannot arbitrate this:
 * to keep native scrolling the element must leave `touch-action` alone, and
 * with `touch-action` alone the browser claims the vertical gesture before any
 * drag begins. That is exactly what breaks if you try.
 *
 * So the pull is driven by hand. Touch moves are observed through a
 * non-passive listener, which is the only way to call preventDefault and stop
 * the browser mid-gesture. The rules:
 *
 *   - Header and handle: pulling starts immediately, nothing there scrolls.
 *   - Body: a pull becomes a dismissal only when the content is already at the
 *     top and the finger has travelled 10px down. Anywhere mid-scroll the
 *     gesture is left alone and stays a scroll.
 *
 * Mouse input has no such conflict, so it takes the simpler pointer path.
 */
export function Sheet({ open, onClose, title, subtitle, full, children, footer }: Props) {
  const reduce = useReducedMotion();
  const y = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const grabRef = useRef<HTMLDivElement>(null);
  // Held in a ref so the gesture listeners are not rebound whenever the parent
  // passes a fresh onClose closure.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const card = cardRef.current;
    if (!open || reduce || !card) return;

    y.set(0);

    let startY = 0;
    let startAt = 0;
    let claimed = false;
    let active = false;

    const fromGrabArea = (target: EventTarget | null) =>
      target instanceof Node && Boolean(grabRef.current?.contains(target));

    const settle = (offset: number, velocity: number) => {
      if (offset > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) {
        onCloseRef.current();
      } else {
        animate(y, 0, { type: 'spring', stiffness: 420, damping: 36 });
      }
    };

    const begin = (clientY: number, target: EventTarget | null) => {
      startY = clientY;
      startAt = performance.now();
      active = true;
      claimed = fromGrabArea(target);
    };

    const advance = (clientY: number, preventDefault: () => void) => {
      if (!active) return;
      const delta = clientY - startY;

      if (!claimed) {
        // Anything left to scroll up keeps the gesture as a scroll.
        if ((scrollRef.current?.scrollTop ?? 0) > 0 || delta < CLAIM_AT) return;
        claimed = true;
        startY = clientY;
        startAt = performance.now();
      }

      // Stop the browser from also scrolling or rubber-banding the page.
      preventDefault();
      y.set(Math.max(0, clientY - startY));
    };

    const end = (clientY: number) => {
      if (!active) return;
      const offset = claimed ? Math.max(0, clientY - startY) : 0;
      const elapsed = Math.max(1, performance.now() - startAt);
      active = false;
      if (claimed) settle(offset, offset / elapsed);
      claimed = false;
    };

    const onTouchStart = (e: TouchEvent) => begin(e.touches[0].clientY, e.target);
    const onTouchMove = (e: TouchEvent) =>
      advance(e.touches[0].clientY, () => e.cancelable && e.preventDefault());
    const onTouchEnd = (e: TouchEvent) => end(e.changedTouches[0]?.clientY ?? startY);

    const onMouseDown = (e: MouseEvent) => begin(e.clientY, e.target);
    const onMouseMove = (e: MouseEvent) => advance(e.clientY, () => e.preventDefault());
    const onMouseUp = (e: MouseEvent) => end(e.clientY);

    // passive:false is the whole point: preventDefault is what stops the scroll.
    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchmove', onTouchMove, { passive: false });
    card.addEventListener('touchend', onTouchEnd, { passive: true });
    card.addEventListener('touchcancel', onTouchEnd, { passive: true });
    card.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      card.removeEventListener('touchstart', onTouchStart);
      card.removeEventListener('touchmove', onTouchMove);
      card.removeEventListener('touchend', onTouchEnd);
      card.removeEventListener('touchcancel', onTouchEnd);
      card.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [open, reduce, y]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.button
            type="button"
            aria-label="סגירה"
            className="absolute inset-0 bg-scrim backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Outer element owns the open and close animation, inner owns the
              pull, so the two never fight over the same transform. */}
          <motion.div
            className="relative w-full"
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.85 }}
          >
            <motion.div
              ref={cardRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              style={{ y }}
              className={[
                'flex w-full flex-col overflow-hidden bg-canvas',
                'rounded-t-[var(--radius-xl)] shadow-[var(--shadow-sheet)]',
                full ? 'h-[93dvh]' : 'max-h-[88dvh]',
              ].join(' ')}
            >
              <div ref={grabRef} className="shrink-0 cursor-grab active:cursor-grabbing">
                <div className="flex justify-center pt-3.5 pb-1">
                  <span className="h-1.5 w-12 rounded-full bg-line-strong" />
                </div>

                {(title || subtitle) && (
                  <header className="flex items-start gap-3 px-6 pt-2 pb-4">
                    <div className="min-w-0 flex-1">
                      {title && <h2 className="truncate text-[24px]">{title}</h2>}
                      {subtitle && (
                        <p className="mt-1 truncate text-[14px] text-muted">{subtitle}</p>
                      )}
                    </div>
                    <IconButton label="סגירה" size="sm" onClick={onClose} tone="card">
                      <X size={17} weight="bold" />
                    </IconButton>
                  </header>
                )}
              </div>

              <div
                ref={scrollRef}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
