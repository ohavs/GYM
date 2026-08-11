'use client';

import { buildProgram } from './program';
import type { Exercise, Meta, Trainee, WorkoutLog } from './types';

const DAY = 86_400_000;

/**
 * Seed roster for coach mode. Real-sounding Israeli names and uneven adherence,
 * because a demo where everyone trains perfectly teaches a coach nothing.
 */
const ROSTER: Omit<Trainee, 'program' | 'joinedAt' | 'lastActive'>[] = [
  {
    id: 'tr-noa',
    name: 'נעה ברזילי',
    goal: 'muscle',
    level: 2,
    days: 4,
    place: 'gym',
    done: 14,
    planned: 16,
    note: 'חוזרת מפציעת כתף. בלי לחיצות מאחורי הצוואר.',
  },
  {
    id: 'tr-itay',
    name: 'איתי שגב',
    goal: 'strength',
    level: 3,
    days: 5,
    place: 'gym',
    done: 18,
    planned: 20,
    note: 'מתכונן לתחרות פאוורליפטינג באפריל.',
  },
  {
    id: 'tr-rotem',
    name: 'רותם אלמוג',
    goal: 'fat',
    level: 1,
    days: 3,
    place: 'home',
    done: 7,
    planned: 12,
    note: 'מתאמנת בבית עם משקולות וגומיות. עובדת במשמרות.',
  },
  {
    id: 'tr-yonatan',
    name: 'יונתן חדד',
    goal: 'health',
    level: 1,
    days: 2,
    place: 'minimal',
    done: 5,
    planned: 8,
    note: 'חזר לאימונים אחרי שנתיים הפסקה. להתקדם לאט.',
  },
  {
    id: 'tr-shira',
    name: 'שירה קמינסקי',
    goal: 'muscle',
    level: 2,
    days: 4,
    place: 'gym',
    done: 15,
    planned: 16,
    note: 'רוצה דגש על עכוז ורגליים.',
  },
];

const LAST_ACTIVE_DAYS = [0, 1, 6, 11, 2];

/**
 * Ids of the seed roster, kept as a fallback for rosters saved before demo
 * records carried a flag. A trainee the coach added has a timestamped id, so
 * the two can never collide.
 */
const ROSTER_IDS = new Set(ROSTER.map((person) => person.id));

/** True for sample data only, never for anything the user entered. */
export function isDemoTrainee(trainee: Trainee) {
  return trainee.demo === true || ROSTER_IDS.has(trainee.id);
}

/** True for sample history only, never for a workout the user finished. */
export function isDemoLog(log: WorkoutLog) {
  return log.demo === true || log.id.startsWith('demo-');
}

export function seedTrainees(exercises: Exercise[], meta: Meta): Trainee[] {
  const now = Date.now();
  return ROSTER.map((person, i) => ({
    ...person,
    demo: true as const,
    joinedAt: now - (40 + i * 23) * DAY,
    lastActive: now - LAST_ACTIVE_DAYS[i] * DAY,
    program: {
      ...buildProgram({
        goal: person.goal,
        level: person.level,
        days: person.days,
        place: person.place,
        focus: person.id === 'tr-shira' ? ['upper legs'] : [],
        exercises,
        meta,
      }),
      id: `prog-${person.id}`,
      source: 'coach' as const,
    },
  }));
}

export function adherence(trainee: Trainee) {
  return trainee.planned ? trainee.done / trainee.planned : 0;
}

export function adherenceTone(value: number): 'ok' | 'warn' | 'bad' {
  if (value >= 0.8) return 'ok';
  if (value >= 0.55) return 'warn';
  return 'bad';
}
