'use client';

import { allowedEquipment } from './data';
import type {
  Block,
  Exercise,
  Goal,
  Level,
  Meta,
  Place,
  Program,
  ProgramDay,
} from './types';

/* ------------------------------------------------------------------ */
/* Prescription                                                        */
/* ------------------------------------------------------------------ */

type SlotRole = 'primary' | 'secondary' | 'isolation' | 'core';

type Prescription = { sets: number; reps: string; rest: number };

const PRESCRIPTION: Record<Goal, Record<SlotRole, Prescription>> = {
  strength: {
    primary: { sets: 5, reps: '5', rest: 180 },
    secondary: { sets: 4, reps: '6-8', rest: 150 },
    isolation: { sets: 3, reps: '8-10', rest: 90 },
    core: { sets: 3, reps: '8-12', rest: 60 },
  },
  muscle: {
    primary: { sets: 4, reps: '8-10', rest: 120 },
    secondary: { sets: 3, reps: '10-12', rest: 90 },
    isolation: { sets: 3, reps: '12-15', rest: 60 },
    core: { sets: 3, reps: '12-15', rest: 45 },
  },
  fat: {
    primary: { sets: 3, reps: '12', rest: 60 },
    secondary: { sets: 3, reps: '12-15', rest: 45 },
    isolation: { sets: 3, reps: '15', rest: 40 },
    core: { sets: 3, reps: '15-20', rest: 30 },
  },
  health: {
    primary: { sets: 3, reps: '10', rest: 90 },
    secondary: { sets: 3, reps: '10-12', rest: 75 },
    isolation: { sets: 2, reps: '12-15', rest: 60 },
    core: { sets: 2, reps: '12-15', rest: 45 },
  },
};

export const GOAL_LABEL: Record<Goal, string> = {
  muscle: 'בניית מסה',
  strength: 'כוח',
  fat: 'חיטוב ושריפת שומן',
  health: 'בריאות וכושר כללי',
};

export const PLACE_LABEL: Record<Place, string> = {
  gym: 'חדר כושר מלא',
  home: 'ציוד ביתי',
  minimal: 'מינימלי',
};

export const LEVEL_LABEL: Record<Level, string> = {
  1: 'מתחיל',
  2: 'בינוני',
  3: 'מתקדם',
};

/* ------------------------------------------------------------------ */
/* Day templates                                                       */
/* ------------------------------------------------------------------ */

type Slot = {
  role: SlotRole;
  /** Movement patterns that satisfy this slot, best first. */
  pat: string[];
  /** Optional target-muscle narrowing, used when a pattern is too broad. */
  tg?: string[];
  bp?: string[];
};

type DayTemplate = {
  key: string;
  name: string;
  subtitle: string;
  slots: Slot[];
};

const CORE_SLOT: Slot = { role: 'core', pat: ['crunch', 'plank', 'leg-raise', 'core', 'twist'] };

const TEMPLATES: Record<string, DayTemplate> = {
  fullA: {
    key: 'fullA',
    name: 'גוף מלא א',
    subtitle: 'רגליים, דחיפה ומשיכה',
    slots: [
      { role: 'primary', pat: ['squat'] },
      { role: 'primary', pat: ['press-horizontal', 'pushup'] },
      { role: 'secondary', pat: ['row'] },
      { role: 'isolation', pat: ['lateral-raise'] },
      { role: 'isolation', pat: ['curl'] },
      CORE_SLOT,
    ],
  },
  fullB: {
    key: 'fullB',
    name: 'גוף מלא ב',
    subtitle: 'הינג׳, דחיפה מעל הראש ומשיכה אנכית',
    slots: [
      { role: 'primary', pat: ['hinge'] },
      { role: 'primary', pat: ['press-vertical'] },
      { role: 'secondary', pat: ['pulldown', 'pullup'] },
      { role: 'isolation', pat: ['leg-curl'] },
      { role: 'isolation', pat: ['triceps-extension'] },
      CORE_SLOT,
    ],
  },
  fullC: {
    key: 'fullC',
    name: 'גוף מלא ג',
    subtitle: 'רגל אחת, חזה וגב עליון',
    slots: [
      { role: 'primary', pat: ['lunge', 'leg-press'] },
      { role: 'primary', pat: ['dip', 'pushup', 'press-horizontal'] },
      { role: 'secondary', pat: ['row'] },
      { role: 'isolation', pat: ['rear-delt'] },
      { role: 'isolation', pat: ['calf'] },
      CORE_SLOT,
    ],
  },
  upperA: {
    key: 'upperA',
    name: 'פלג גוף עליון א',
    subtitle: 'דגש דחיפה',
    slots: [
      { role: 'primary', pat: ['press-horizontal'] },
      { role: 'secondary', pat: ['row'] },
      { role: 'secondary', pat: ['press-vertical'] },
      { role: 'secondary', pat: ['pulldown', 'pullup'] },
      { role: 'isolation', pat: ['curl'] },
      { role: 'isolation', pat: ['triceps-extension'] },
    ],
  },
  upperB: {
    key: 'upperB',
    name: 'פלג גוף עליון ב',
    subtitle: 'דגש משיכה',
    slots: [
      { role: 'primary', pat: ['pullup', 'pulldown'] },
      { role: 'secondary', pat: ['press-horizontal'] },
      { role: 'secondary', pat: ['row'] },
      { role: 'isolation', pat: ['lateral-raise'] },
      { role: 'isolation', pat: ['curl'] },
      { role: 'isolation', pat: ['triceps-extension'] },
    ],
  },
  lowerA: {
    key: 'lowerA',
    name: 'פלג גוף תחתון א',
    subtitle: 'דגש סקוואט',
    slots: [
      { role: 'primary', pat: ['squat'] },
      { role: 'secondary', pat: ['hinge'] },
      { role: 'secondary', pat: ['leg-press', 'lunge'] },
      { role: 'isolation', pat: ['leg-curl'] },
      { role: 'isolation', pat: ['calf'] },
      CORE_SLOT,
    ],
  },
  lowerB: {
    key: 'lowerB',
    name: 'פלג גוף תחתון ב',
    subtitle: 'דגש הינג׳ ועכוז',
    slots: [
      { role: 'primary', pat: ['hinge'] },
      { role: 'secondary', pat: ['lunge'] },
      { role: 'secondary', pat: ['leg-extension'] },
      { role: 'isolation', pat: ['hip-thrust', 'glute'] },
      { role: 'isolation', pat: ['calf'] },
      CORE_SLOT,
    ],
  },
  push: {
    key: 'push',
    name: 'דחיפה',
    subtitle: 'חזה, כתפיים ותלת ראשי',
    slots: [
      { role: 'primary', pat: ['press-horizontal'] },
      { role: 'secondary', pat: ['press-vertical'] },
      { role: 'secondary', pat: ['fly'] },
      { role: 'isolation', pat: ['lateral-raise'] },
      { role: 'isolation', pat: ['triceps-extension'] },
      { role: 'isolation', pat: ['triceps-extension', 'dip'] },
    ],
  },
  pull: {
    key: 'pull',
    name: 'משיכה',
    subtitle: 'גב ודו ראשי',
    slots: [
      { role: 'primary', pat: ['pulldown', 'pullup'] },
      { role: 'secondary', pat: ['row'] },
      { role: 'secondary', pat: ['row'] },
      { role: 'isolation', pat: ['rear-delt'] },
      { role: 'isolation', pat: ['curl'] },
      { role: 'isolation', pat: ['curl', 'shrug'] },
    ],
  },
  legs: {
    key: 'legs',
    name: 'רגליים',
    subtitle: 'ארבע ראשי, מיתרים ותאומים',
    slots: [
      { role: 'primary', pat: ['squat'] },
      { role: 'secondary', pat: ['hinge'] },
      { role: 'secondary', pat: ['leg-press', 'lunge'] },
      { role: 'isolation', pat: ['leg-curl'] },
      { role: 'isolation', pat: ['calf'] },
      CORE_SLOT,
    ],
  },
};

function splitFor(days: number, level: Level): { split: string; keys: string[] } {
  if (days <= 2) return { split: 'גוף מלא', keys: ['fullA', 'fullB'] };
  if (days === 3)
    return level === 1
      ? { split: 'גוף מלא', keys: ['fullA', 'fullB', 'fullC'] }
      : { split: 'דחיפה משיכה רגליים', keys: ['push', 'pull', 'legs'] };
  if (days === 4)
    return { split: 'עליון תחתון', keys: ['upperA', 'lowerA', 'upperB', 'lowerB'] };
  if (days === 5)
    return { split: 'משולב', keys: ['push', 'pull', 'legs', 'upperA', 'lowerA'] };
  return { split: 'דחיפה משיכה רגליים כפול', keys: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] };
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

type BuildInput = {
  goal: Goal;
  level: Level;
  days: number;
  place: Place;
  focus: string[];
  exercises: Exercise[];
  meta: Meta;
};

function candidatesFor(
  slot: Slot,
  pool: Exercise[],
  focus: string[],
  level: Level,
): Exercise[] {
  const wanted = new Set(slot.pat);
  return pool
    .filter((ex) => wanted.has(ex.pat))
    .filter((ex) => (slot.bp ? slot.bp.includes(ex.bp) : true))
    .filter((ex) => (slot.tg ? slot.tg.includes(ex.tg) : true))
    .filter((ex) => ex.lvl <= level + (level === 1 ? 1 : 0))
    .map((ex) => {
      let score = ex.rank;
      // Patterns earlier in the slot definition are the preferred movement.
      score -= slot.pat.indexOf(ex.pat) * 12;
      if (focus.includes(ex.bp)) score += 18;
      if (ex.lvl > level) score -= 20;
      return { ex, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.ex);
}

/** Alternatives shown behind "החלף תרגיל" during a workout. */
export function alternativesFor(
  exercise: Exercise,
  all: Exercise[],
  place: Place,
  meta: Meta,
  limit = 12,
): Exercise[] {
  const allowed = allowedEquipment(place, meta);
  return all
    .filter(
      (ex) =>
        ex.id !== exercise.id &&
        (ex.pat === exercise.pat || ex.tg === exercise.tg) &&
        allowed.has(ex.eq),
    )
    .sort(
      (a, b) =>
        Number(b.pat === exercise.pat) - Number(a.pat === exercise.pat) ||
        b.rank - a.rank,
    )
    .slice(0, limit);
}

export function buildProgram(input: BuildInput): Program {
  const { goal, level, days, place, focus, exercises, meta } = input;
  const allowed = allowedEquipment(place, meta);
  const pool = exercises.filter((ex) => allowed.has(ex.eq) && ex.bp !== 'cardio');

  const { split, keys } = splitFor(days, level);
  const used = new Set<string>();
  const rx = PRESCRIPTION[goal];

  const programDays: ProgramDay[] = keys.map((key, dayIndex) => {
    const template = TEMPLATES[key];
    const blocks: Block[] = [];

    for (const slot of template.slots) {
      const options = candidatesFor(slot, pool, focus, level);
      const pick =
        options.find((ex) => !used.has(ex.id)) ??
        options[0] ??
        pool.find((ex) => !used.has(ex.id));
      if (!pick) continue;
      used.add(pick.id);
      const p = rx[slot.role];
      blocks.push({
        exerciseId: pick.id,
        sets: p.sets,
        reps: pick.timed ? '30-45 שניות' : p.reps,
        rest: p.rest,
      });
    }

    return {
      id: `${key}-${dayIndex}`,
      name: template.name,
      subtitle: template.subtitle,
      blocks,
    };
  });

  return {
    id: `auto-${Date.now()}`,
    name: `${split} - ${GOAL_LABEL[goal]}`,
    split,
    goal,
    days: programDays,
    createdAt: Date.now(),
    source: 'auto',
  };
}

/* ------------------------------------------------------------------ */
/* Volume summary                                                      */
/* ------------------------------------------------------------------ */

export function weeklyMuscleSplit(
  program: Program,
  byId: Map<string, Exercise>,
  meta: Meta,
): { label: string; sets: number }[] {
  const totals = new Map<string, number>();
  for (const day of program.days) {
    for (const block of day.blocks) {
      const ex = byId.get(block.exerciseId);
      if (!ex) continue;
      const label = meta.bodyParts.find((b) => b.key === ex.bp)?.short ?? ex.bp;
      totals.set(label, (totals.get(label) ?? 0) + block.sets);
    }
  }
  return [...totals.entries()]
    .map(([label, sets]) => ({ label, sets }))
    .sort((a, b) => b.sets - a.sets);
}
