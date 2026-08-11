'use client';

import { useMemo } from 'react';
import { useNow } from './clock';
import { useStore } from './store';
import { weekKey } from './format';
import type { Exercise, ProgramDay, WorkoutLog } from './types';

/** Rough session length: work sets plus their prescribed rest. */
export function estimateMinutes(day: ProgramDay) {
  const seconds = day.blocks.reduce(
    (total, block) => total + block.sets * (40 + block.rest),
    0,
  );
  return Math.round(seconds / 60);
}

/** The next day in the rotation, based on the last session that was logged. */
export function useTodayPlan() {
  const program = useStore((s) => s.program);
  const logs = useStore((s) => s.logs);

  return useMemo(() => {
    if (!program?.days.length) return null;
    const lastForProgram = logs.find((log) => log.programId === program.id);
    const lastIndex = lastForProgram
      ? program.days.findIndex((d) => d.id === lastForProgram.dayId)
      : -1;
    const index = lastIndex === -1 ? 0 : (lastIndex + 1) % program.days.length;
    return { day: program.days[index], index, program };
  }, [program, logs]);
}

export function useWeekStats() {
  const logs = useStore((s) => s.logs);
  const target = useStore((s) => s.profile.days);
  const now = useNow();

  return useMemo(() => {
    const thisWeek = weekKey(now);
    const week = logs.filter((log) => weekKey(log.startedAt) === thisWeek);
    const volume = week.reduce((sum, log) => sum + log.volume, 0);
    const minutes = week.reduce((sum, log) => sum + (log.endedAt - log.startedAt) / 60_000, 0);
    return {
      sessions: week.length,
      target,
      volume,
      minutes: Math.round(minutes),
      progress: target ? Math.min(1, week.length / target) : 0,
      days: new Set(week.map((log) => new Date(log.startedAt).getDay())),
    };
  }, [logs, target, now]);
}

/** Consecutive weeks in which at least one session was logged. */
export function useStreak() {
  const logs = useStore((s) => s.logs);
  const now = useNow();
  return useMemo(() => {
    if (!logs.length) return 0;
    const weeks = new Set(logs.map((log) => weekKey(log.startedAt)));
    let streak = 0;
    let cursor = weekKey(now);
    // An untouched current week does not break a streak that is still alive.
    if (!weeks.has(cursor)) cursor -= 7 * 86_400_000;
    while (weeks.has(cursor)) {
      streak += 1;
      cursor -= 7 * 86_400_000;
    }
    return streak;
  }, [logs, now]);
}

export function personalBests(logs: WorkoutLog[], byId: Map<string, Exercise>) {
  const best = new Map<string, { weight: number; reps: number; at: number; exercise: Exercise }>();
  for (const log of logs) {
    for (const entry of log.entries) {
      const exercise = byId.get(entry.exerciseId);
      if (!exercise) continue;
      for (const set of entry.sets) {
        const current = best.get(entry.exerciseId);
        if (!current || set.weight > current.weight) {
          best.set(entry.exerciseId, {
            weight: set.weight,
            reps: set.reps,
            at: log.startedAt,
            exercise,
          });
        }
      }
    }
  }
  return [...best.values()].filter((b) => b.weight > 0).sort((a, b) => b.at - a.at);
}
