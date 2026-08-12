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
import { useLinksContext } from '@/components/app-providers';
import { haptic } from '@/lib/haptics';

/**
 * The personal tabs are always here. Coaching used to *replace* the מסלול tab,
 * which meant turning the workspace on took away the coach's own training —
 * and a coach trains too. It is an extra tab now, not a different app.
 */
const TABS = [
  { href: '/', label: 'בית', Icon: House },
  { href: '/program', label: 'מסלול', Icon: Barbell },
  { href: '/library', label: 'תרגילים', Icon: MagnifyingGlass },
  { href: '/progress', label: 'התקדמות', Icon: ChartLineUp },
  { href: '/profile', label: 'פרופיל', Icon: UserCircle },
];

const COACH_TAB = { href: '/coach', label: 'מתאמנים', Icon: UsersThree };

/**
 * A floating dock rather than an edge-to-edge bar: it keeps the soft canvas
 * visible underneath and lets the active tab read as a solid ink pill.
 */
export function TabBar() {
  const pathname = usePathname();
  const role = useStore((s) => s.profile.role);
  const coaching = useLinksContext().asCoach.length > 0;
  // Shown once there is anything to coach, whether the workspace was switched
  // on in settings or somebody has asked to join.
  const tabs = role === 'coach' || coaching ? [...TABS.slice(0, 2), COACH_TAB, ...TABS.slice(2)] : TABS;

  return (
    <nav
      aria-label="ניווט ראשי"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),10px)]"
    >
      <ul
        className="pointer-events-auto mx-auto grid max-w-[460px] rounded-full bg-card p-2 shadow-[var(--shadow-dock)]"
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
                    className={active ? 'text-on-ink' : 'text-faint'}
                  />
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[10px] font-medium text-on-ink"
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
