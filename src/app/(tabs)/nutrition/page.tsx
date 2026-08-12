'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ForkKnife, Scales } from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen, ScreenHeader } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { EmptyState, Stepper } from '@/components/ui/controls';
import { MenuDayView } from '@/components/nutrition/menu-day';
import { useAccount, useLinksContext } from '@/components/app-providers';
import { useNavigation } from '@/components/layout/navigation';
import { assignedMenu, dayKey, useDailyLog } from '@/lib/nutrition';
import { initials } from '@/lib/format';
import { haptic } from '@/lib/haptics';

/**
 * The trainee's day of eating, and the one place they report back.
 *
 * It only exists when a coach has written a menu — this is not a food diary
 * the app asks people to keep on their own, it is the other half of a coach's
 * plan. Without a coach the screen says so plainly rather than inventing work.
 */
export default function NutritionPage() {
  const nav = useNavigation();
  const { user } = useAccount();
  const links = useLinksContext();
  const assigned = assignedMenu(links);
  const today = dayKey();
  const { log, setMeal, setWeight } = useDailyLog(user?.uid ?? null, today);

  const [weighing, setWeighing] = useState(false);

  if (!assigned) {
    return (
      <Screen>
        <ScreenHeader title="התפריט שלי" />
        <EmptyState
          icon={<ForkKnife size={30} />}
          title="אין תפריט פעיל"
          body={
            links.asTrainee.length
              ? 'המאמן שלכם עוד לא בנה תפריט. ברגע שיבנה, הוא יופיע כאן.'
              : 'תפריטים נבנים על ידי מאמן. אם יש לכם מאמן, בקשו ממנו את קוד ההצטרפות.'
          }
          action={
            !links.asTrainee.length ? (
              <Button size="lg" onClick={() => nav.go('/join')}>
                הצטרפות למאמן
              </Button>
            ) : undefined
          }
        />
      </Screen>
    );
  }

  const day = assigned.menu.days[0];
  const done = day?.meals.filter((m) => log.meals[m.id]?.status === 'done').length ?? 0;
  const total = day?.meals.length ?? 0;

  return (
    <Screen>
      <ScreenHeader title="התפריט שלי" subtitle={assigned.menu.name} />

      <Rise>
        <section className="mb-6 rounded-[var(--radius-lg)] bg-hero p-6 text-on-hero">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] text-on-hero/68">היום</p>
              <p className="num mt-1 text-[34px] font-semibold leading-none">
                {done}
                <span className="text-[20px] text-on-hero/68">/{total}</span>
              </p>
              <p className="mt-2 text-[13px] text-on-hero/68">ארוחות סומנו</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-on-hero/12 text-[13px] font-semibold">
              {initials(assigned.coachName)}
            </span>
          </div>

          {/* One tap between "I weighed myself" and the coach seeing it. */}
          <div className="mt-6 flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-on-hero/12 px-4 py-3">
            <span className="flex items-center gap-2 text-[14px]">
              <Scales size={17} weight="bold" />
              משקל הבוקר
            </span>
            {weighing || log.weight ? (
              <Stepper
                value={log.weight ?? 70}
                onChange={(weight) => setWeight(weight)}
                step={0.5}
                min={30}
                max={250}
                compact
                label="משקל גוף"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  haptic('select');
                  setWeighing(true);
                }}
                className="rounded-full bg-on-hero px-4 py-2 text-[13px] font-medium text-hero"
              >
                הוספה
              </button>
            )}
          </div>
        </section>
      </Rise>

      {assigned.menu.note && (
        <Rise>
          <p className="mb-5 rounded-[var(--radius-lg)] bg-butter p-5 text-[14px] leading-relaxed">
            {assigned.menu.note}
          </p>
        </Rise>
      )}

      <Rise>
        <motion.div layout>
          <MenuDayView menu={assigned.menu} log={log} onSet={setMeal} />
        </motion.div>
      </Rise>
    </Screen>
  );
}
