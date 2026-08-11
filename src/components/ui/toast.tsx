'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Info, Warning } from '@phosphor-icons/react/dist/ssr';
import { haptic } from '@/lib/haptics';

type Tone = 'ok' | 'info' | 'warn';

type Toast = {
  id: number;
  text: string;
  detail?: string;
  tone: Tone;
  action?: { label: string; onPress: () => void };
};

type Ctx = (toast: Omit<Toast, 'id'> | string) => void;

const ToastContext = createContext<Ctx>(() => {});

export const useToast = () => useContext(ToastContext);

const TONES: Record<Tone, { icon: React.ReactNode; tile: string }> = {
  ok: { icon: <Check size={16} weight="bold" />, tile: 'bg-mint text-ink' },
  info: { icon: <Info size={16} weight="bold" />, tile: 'bg-lilac text-ink' },
  warn: { icon: <Warning size={16} weight="bold" />, tile: 'bg-butter text-ink' },
};

/**
 * Toasts float above the dock rather than at the top: on a phone the bottom
 * third is where the thumb and the user's attention already are.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback<Ctx>((input) => {
    const base = typeof input === 'string' ? { text: input, tone: 'info' as Tone } : input;
    const id = ++seq.current;
    haptic(base.tone === 'ok' ? 'success' : base.tone === 'warn' ? 'warn' : 'select');
    setToasts((list) => [...list.slice(-2), { id, ...base }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3600);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--dock-h)+max(env(safe-area-inset-bottom),10px)+26px)] z-[70] flex flex-col items-center gap-2 px-5">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-full bg-card p-2 ps-2 pe-5 shadow-[var(--shadow-pop)]"
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full ${TONES[toast.tone].tile}`}
              >
                {TONES[toast.tone].icon}
              </span>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="truncate text-[14px] font-medium">{toast.text}</p>
                {toast.detail && (
                  <p className="truncate text-[12px] text-muted">{toast.detail}</p>
                )}
              </div>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onPress();
                    setToasts((list) => list.filter((t) => t.id !== toast.id));
                  }}
                  className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white"
                >
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
