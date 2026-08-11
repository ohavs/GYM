'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Info, WarningCircle } from '@phosphor-icons/react/dist/ssr';
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

const TONES: Record<Tone, { icon: React.ReactNode; ring: string }> = {
  ok: { icon: <CheckCircle size={20} weight="fill" />, ring: 'text-ok' },
  info: { icon: <Info size={20} weight="fill" />, ring: 'text-accent' },
  warn: { icon: <WarningCircle size={20} weight="fill" />, ring: 'text-warn' },
};

/**
 * Toasts appear above the tab bar rather than at the top: on a phone the
 * bottom third is where the thumb and the user's attention already are.
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
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tab-h)+max(env(safe-area-inset-bottom),8px)+12px)] z-[70] flex flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-[var(--shadow-lift)] backdrop-blur-xl"
            >
              <span className={TONES[toast.tone].ring}>{TONES[toast.tone].icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{toast.text}</p>
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
                  className="shrink-0 rounded-full bg-accent-wash px-3 py-1.5 text-[13px] font-semibold text-accent"
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
