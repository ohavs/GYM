'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from '@phosphor-icons/react/dist/ssr';
import { IconButton } from './button';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Sheets that own the full screen (workout player pickers) skip the top gap. */
  full?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Bottom sheet with drag-to-dismiss. Sheets are the primary modal surface on
 * mobile: the thumb reaches the handle, and the page stays visible behind.
 */
export function Sheet({ open, onClose, title, subtitle, full, children, footer }: Props) {
  const reduce = useReducedMotion();

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <motion.button
            type="button"
            aria-label="סגירה"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={[
              'relative flex w-full flex-col overflow-hidden bg-bg-elev',
              'rounded-t-[28px] border-t border-x border-line shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.7)]',
              full ? 'h-[94dvh]' : 'max-h-[88dvh]',
            ].join(' ')}
            initial={reduce ? { opacity: 0 } : { y: '100%' }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36, mass: 0.9 }}
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <span className="h-1.5 w-11 rounded-full bg-surface-3" />
            </div>

            {(title || subtitle) && (
              <header className="flex items-start gap-3 px-5 pb-3 pt-1">
                <div className="min-w-0 flex-1">
                  {title && <h2 className="truncate text-[19px]">{title}</h2>}
                  {subtitle && (
                    <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>
                  )}
                </div>
                <IconButton label="סגירה" onClick={onClose} className="-mt-1">
                  <X size={18} weight="bold" />
                </IconButton>
              </header>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
              {children}
            </div>

            {footer && (
              <div className="border-t border-line-soft bg-bg-elev px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                {footer}
              </div>
            )}
            {!footer && <div className="pb-[max(env(safe-area-inset-bottom),16px)]" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
