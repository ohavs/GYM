'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Barbell,
  ChartLineUp,
  House,
  MagnifyingGlass,
  UserCircle,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr';
import { useStore } from '@/lib/store';
import { haptic } from '@/lib/haptics';

const TRAINEE_TABS = [
  { href: '/', label: 'בית', Icon: House },
  { href: '/program', label: 'מסלול', Icon: Barbell },
  { href: '/library', label: 'תרגילים', Icon: MagnifyingGlass },
  { href: '/progress', label: 'התקדמות', Icon: ChartLineUp },
  { href: '/profile', label: 'פרופיל', Icon: UserCircle },
];

const COACH_TABS = [
  { href: '/', label: 'בית', Icon: House },
  { href: '/coach', label: 'מתאמנים', Icon: UsersThree },
  { href: '/library', label: 'תרגילים', Icon: MagnifyingGlass },
  { href: '/progress', label: 'התקדמות', Icon: ChartLineUp },
  { href: '/profile', label: 'פרופיל', Icon: UserCircle },
];

/**
 * A floating dock rather than an edge-to-edge bar: it keeps the soft canvas
 * visible underneath and lets the active tab read as a solid ink pill.
 */
export function TabBar() {
  const pathname = usePathname();
  const role = useStore((s) => s.profile.role);
  const tabs = role === 'coach' ? COACH_TABS : TRAINEE_TABS;

  return (
    <nav
      aria-label="ניווט ראשי"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),10px)]"
    >
      <ul
        className="pointer-events-auto mx-auto grid max-w-[440px] rounded-full bg-card p-2 shadow-[var(--shadow-dock)]"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
          height: 'var(--dock-h)',
        }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="relative">
              <Link
                href={href}
                onClick={() => haptic('select')}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className="relative flex h-full items-center justify-center rounded-full"
              >
                {active && (
                  <motion.span
                    layoutId="dock-pill"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    className="absolute inset-0 rounded-full bg-ink"
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-0.5">
                  <Icon
                    size={22}
                    weight={active ? 'fill' : 'regular'}
                    className={active ? 'text-white' : 'text-faint'}
                  />
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[10px] font-medium text-white"
                    >
                      {label}
                    </motion.span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
