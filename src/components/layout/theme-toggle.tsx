'use client';

import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Moon, Sun } from '@phosphor-icons/react/dist/ssr';
import { useStore } from '@/lib/store';
import { haptic } from '@/lib/haptics';

const QUERY = '(prefers-color-scheme: dark)';

/**
 * Whether the device is asking for dark right now.
 *
 * Read through useSyncExternalStore rather than an effect: the server has no
 * media query to answer with, and this way the first client pass matches the
 * markup instead of correcting it a frame later.
 */
function useSystemDark() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/**
 * Light/dark switch, present in every screen's header.
 *
 * It shows where a tap will take you, not where you are — the icon is the
 * destination, which is what makes a one-button switch legible. Tapping always
 * writes an explicit choice, so "לפי המכשיר" stays something the user opts
 * into from settings rather than something they fall out of by accident.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const systemDark = useSystemDark();
  const reduce = useReducedMotion();

  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  const label = dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה';

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      onClick={() => {
        haptic('select');
        setTheme(dark ? 'light' : 'dark');
      }}
      className={`relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-card text-ink-soft shadow-[var(--shadow-soft)] ${className}`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={dark ? 'sun' : 'moon'}
          initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -70, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 70, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="grid place-items-center"
        >
          {dark ? <Sun size={19} weight="bold" /> : <Moon size={19} weight="bold" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
