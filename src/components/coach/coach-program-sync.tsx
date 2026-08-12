'use client';

import { useEffect, useRef } from 'react';
import { useLinksContext } from '@/components/app-providers';
import { useStore } from '@/lib/store';
import { refreshTraineeCard } from '@/lib/links';
import { useToast } from '@/components/ui/toast';

/**
 * Brings a coach's program down onto the trainee's device.
 *
 * The link document is the coach's copy and the store is the trainee's; this
 * keeps the second in step with the first. Two rules make it safe to run
 * unattended:
 *
 *   - It never interrupts a workout in progress. A program swapping under
 *     somebody mid-set would be the worst possible moment.
 *   - It never overwrites a personal program silently. The first assignment is
 *     offered, not applied; after the trainee has accepted a coach's program,
 *     later updates land straight away, which is the point of having a coach.
 */
export function CoachProgramSync() {
  const toast = useToast();
  const links = useLinksContext();
  const program = useStore((s) => s.program);
  const setProgram = useStore((s) => s.setProgram);
  const profile = useStore((s) => s.profile);
  const active = links.asTrainee.find((l) => l.status === 'active') ?? null;

  // Latest values, so the effect below can depend only on what should trigger it.
  const latest = useRef({ program, setProgram, toast, profile });
  useEffect(() => {
    latest.current = { program, setProgram, toast, profile };
  });

  const assigned = active?.program ?? null;
  const stamp = assigned ? `${active?.id}:${assigned.id}:${assigned.createdAt}` : null;
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!stamp || !assigned) return;
    if (appliedRef.current === stamp) return;

    const { program: current, setProgram: apply, toast: notify } = latest.current;
    if (useStore.getState().active) return; // mid-workout, try again later

    // A personal program is only replaced once the trainee is following the
    // coach; before that, the assignment waits on the program screen.
    if (current && current.source !== 'coach') return;

    appliedRef.current = stamp;
    if (current?.id === assigned.id && current.createdAt === assigned.createdAt) return;

    apply(assigned);
    notify({
      text: current ? 'המסלול שלכם עודכן' : 'קיבלתם מסלול חדש',
      detail: `מאת ${active?.coachName ?? 'המאמן שלכם'}`,
      tone: 'ok',
    });
  }, [stamp, assigned, active?.coachName]);

  // Keep the card the coach sees in step with the trainee's own settings.
  const card = active
    ? `${active.id}|${profile.name}|${profile.goal}|${profile.level}|${profile.days}|${profile.place}`
    : null;
  const pushedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!card || !active) return;
    if (pushedRef.current === card) return;
    pushedRef.current = card;
    const { profile: p } = latest.current;
    void refreshTraineeCard(active.id, {
      traineeName: p.name || active.traineeName,
      traineeGoal: p.goal,
      traineeLevel: p.level,
      traineeDays: p.days,
      traineePlace: p.place,
    }).catch(() => {});
  }, [card, active]);

  return null;
}
