'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { getDb } from './firebase';
import type { Links } from './links';

/**
 * Nutrition, kept as text.
 *
 * A coach writes "3 ביצים + פרוסת לחם מלא", which is how coaching actually
 * happens; a food database in Hebrew is a project of its own and none is
 * freely licensed. Macros are optional per item, so a coach who counts can,
 * and one who does not is never blocked by empty fields.
 */
export type MealItem = {
  id: string;
  text: string;
  amount?: string;
  kcal?: number;
  protein?: number;
};

export type Meal = {
  id: string;
  name: string;
  time?: string;
  items: MealItem[];
  note?: string;
};

export type MenuDay = {
  id: string;
  /** "יום אימון" / "יום מנוחה", or a weekday. Most menus need one or two. */
  name: string;
  meals: Meal[];
};

export type Menu = {
  id: string;
  name: string;
  note?: string;
  days: MenuDay[];
  createdAt: number;
};

export const mealTotals = (meal: Meal) =>
  meal.items.reduce(
    (sum, item) => ({
      kcal: sum.kcal + (item.kcal ?? 0),
      protein: sum.protein + (item.protein ?? 0),
    }),
    { kcal: 0, protein: 0 },
  );

export const dayTotals = (day: MenuDay) =>
  day.meals.reduce(
    (sum, meal) => {
      const totals = mealTotals(meal);
      return { kcal: sum.kcal + totals.kcal, protein: sum.protein + totals.protein };
    },
    { kcal: 0, protein: 0 },
  );

/** True when the coach filled in any numbers at all. */
export const hasMacros = (menu: Menu) =>
  menu.days.some((day) => day.meals.some((meal) => meal.items.some((i) => i.kcal || i.protein)));

const uid = () => Math.random().toString(36).slice(2, 9);

export const newItem = (text = ''): MealItem => ({ id: uid(), text });
export const newMeal = (name: string, time?: string): Meal => ({
  id: uid(),
  name,
  time,
  items: [newItem()],
});

/** A first draft a coach edits rather than a blank page. */
export function starterMenu(): Menu {
  return {
    id: `menu-${Date.now()}`,
    name: 'תפריט יומי',
    days: [
      {
        id: uid(),
        name: 'יום רגיל',
        meals: [
          newMeal('ארוחת בוקר', '07:30'),
          newMeal('ארוחת צהריים', '13:00'),
          newMeal('ארוחת ערב', '19:30'),
          newMeal('נשנוש', '16:30'),
        ],
      },
    ],
    createdAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* The daily check-in                                                  */
/* ------------------------------------------------------------------ */

export type MealStatus = 'done' | 'skipped' | 'other';

export type DailyLog = {
  /** YYYY-MM-DD, and also the document id. */
  day: string;
  meals: Record<string, { status: MealStatus; note?: string; at: number }>;
  weight?: number;
  updatedAt: number;
};

/** Local date, not UTC: "today" has to mean the day the person is living in. */
export function dayKey(when = new Date()) {
  const y = when.getFullYear();
  const m = String(when.getMonth() + 1).padStart(2, '0');
  const d = String(when.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBack(count: number) {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const when = new Date();
    when.setDate(when.getDate() - i);
    out.push(dayKey(when));
  }
  return out;
}

const EMPTY_DAY = (day: string): DailyLog => ({ day, meals: {}, updatedAt: 0 });

/**
 * The trainee's own check-in for one day.
 *
 * One document per day: bounded in size, addressable by date without an index,
 * and cheap enough that ticking off a meal is a single small write. Writes are
 * debounced so a burst of taps settles into one.
 */
export function useDailyLog(uidOfUser: string | null, day: string) {
  const [snapshot, setSnapshot] = useState<{ key: string; log: DailyLog } | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!uidOfUser || !db) return;
    const ref = doc(db, 'users', uidOfUser, 'daily', day);
    return onSnapshot(
      ref,
      (result) =>
        setSnapshot({
          key: `${uidOfUser}:${day}`,
          log: result.exists() ? (result.data() as DailyLog) : EMPTY_DAY(day),
        }),
      () => setSnapshot({ key: `${uidOfUser}:${day}`, log: EMPTY_DAY(day) }),
    );
  }, [uidOfUser, day]);

  const key = `${uidOfUser}:${day}`;
  const remote = snapshot && snapshot.key === key ? snapshot.log : null;

  // Held locally as well, so a tap paints immediately even before Firestore's
  // own cache echoes it back.
  const [draft, setDraft] = useState<{ key: string; log: DailyLog } | null>(null);
  const log = draft && draft.key === key ? draft.log : (remote ?? EMPTY_DAY(day));

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const write = (next: DailyLog) => {
    setDraft({ key, log: next });
    const db = getDb();
    if (!uidOfUser || !db) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void setDoc(doc(db, 'users', uidOfUser, 'daily', day), next, { merge: true }).catch(() => {});
    }, 500);
  };

  const setMeal = (mealId: string, status: MealStatus | null, note?: string) => {
    const meals = { ...log.meals };
    if (status === null) delete meals[mealId];
    else meals[mealId] = { status, note, at: Date.now() };
    write({ ...log, day, meals, updatedAt: Date.now() });
  };

  const setWeight = (weight: number | undefined) =>
    write({ ...log, day, weight, updatedAt: Date.now() });

  return { log, ready: remote !== null || !uidOfUser, setMeal, setWeight };
}

/* ------------------------------------------------------------------ */
/* What the coach sees                                                 */
/* ------------------------------------------------------------------ */

export type MenuAdherence = {
  /** Meals ticked off, out of meals asked for, over the window. */
  done: number;
  planned: number;
  /** Most recent weigh-in the trainee recorded, if any. */
  weight?: number;
  weightAt?: string;
  days: { day: string; done: number; planned: number }[];
};

/**
 * A trainee's recent check-ins, read straight from their own subtree.
 *
 * The coach never gets a copy of this: the rules grant read access for exactly
 * as long as the link exists, so revoking is the whole story.
 */
export function useDailyHistory(traineeUid: string | undefined, menu: Menu | null, span = 14) {
  const [fetched, setFetched] = useState<{ key: string; logs: DailyLog[] } | null>(null);
  const key = `${traineeUid ?? ''}:${span}`;

  useEffect(() => {
    const db = getDb();
    if (!traineeUid || !db) return;
    let alive = true;
    const since = daysBack(span).at(-1)!;
    getDocs(
      query(collection(db, 'users', traineeUid, 'daily'), where('__name__', '>=', since)),
    )
      .then((snapshot) => {
        if (alive) setFetched({ key, logs: snapshot.docs.map((d) => d.data() as DailyLog) });
      })
      .catch(() => alive && setFetched({ key, logs: [] }));
    return () => {
      alive = false;
    };
  }, [traineeUid, span, key]);

  const logs = fetched && fetched.key === key ? fetched.logs : null;

  return useMemo<MenuAdherence | null>(() => {
    if (!logs) return null;
    const perDay = menu?.days[0]?.meals.length ?? 0;
    const window = daysBack(span);
    const byDay = new Map(logs.map((l) => [l.day, l]));

    const days = window.map((day) => {
      const log = byDay.get(day);
      const done = log
        ? Object.values(log.meals).filter((m) => m.status === 'done').length
        : 0;
      return { day, done, planned: perDay };
    });

    const weighed = logs
      .filter((l) => typeof l.weight === 'number')
      .sort((a, b) => b.day.localeCompare(a.day))[0];

    return {
      done: days.reduce((sum, d) => sum + d.done, 0),
      planned: days.reduce((sum, d) => sum + d.planned, 0),
      weight: weighed?.weight,
      weightAt: weighed?.day,
      days,
    };
  }, [logs, menu, span]);
}

/** Reads the menu a coach assigned, from the link both sides share. */
export function assignedMenu(links: Links): { menu: Menu; coachName: string; linkId: string } | null {
  const active = links.asTrainee.find((l) => l.status === 'active');
  return active?.menu
    ? { menu: active.menu, coachName: active.coachName, linkId: active.id }
    : null;
}
