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

export function TabBar() {
  const pathname = usePathname();
  const role = useStore((s) => s.profile.role);
  const tabs = role === 'coach' ? COACH_TABS : TRAINEE_TABS;

  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/88 backdrop-blur-2xl"
    >
      <ul
        className="mx-auto grid max-w-[560px]"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`, height: 'var(--tab-h)' }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="relative">
              <Link
                href={href}
                onClick={() => haptic('select')}
                aria-current={active ? 'page' : undefined}
                className="flex h-full flex-col items-center justify-center gap-1"
              >
                <span className="relative grid size-8 place-items-center">
                  {active && (
                    <motion.span
                      layoutId="tab-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      className="absolute inset-0 rounded-full bg-accent-wash"
                    />
                  )}
                  <Icon
                    size={21}
                    weight={active ? 'fill' : 'regular'}
                    className={`relative z-10 ${active ? 'text-accent' : 'text-faint'}`}
                  />
                </span>
                <span
                  className={`text-[11px] font-semibold ${active ? 'text-accent' : 'text-faint'}`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="safe-b" />
    </nav>
  );
}
