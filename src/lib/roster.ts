'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDb } from './firebase';
import type { CoachLink, LinkStatus, Links } from './links';
import type { Menu } from './nutrition';
import type { Goal, Level, Place, Program, Trainee, WorkoutLog } from './types';

/**
 * One roster, two sources.
 *
 * A coach's list holds real people, reached through a link document, and the
 * sample roster that ships with the demo. Rather than teach every screen about
 * both, they are flattened into one shape here and the writes are routed back
 * to wherever the entry came from.
 */
export type RosterEntry = {
  id: string;
  kind: 'local' | 'linked';
  status: LinkStatus;
  name: string;
  goal: Goal;
  level: Level;
  days: number;
  place: Place;
  note: string;
  program: Program | null;
  menu: Menu | null;
  /** Sessions done in the last four weeks, and what the plan asked for. */
  done: number;
  planned: number;
  lastActive: number;
  /** Present only for linked entries, and needed to read their history. */
  traineeUid?: string;
  demo?: boolean;
};

const FOUR_WEEKS = 28 * 86_400_000;

export function fromLink(link: CoachLink, activity?: Activity): RosterEntry {
  const planned = Math.round((link.traineeDays * FOUR_WEEKS) / (7 * 86_400_000));
  return {
    id: link.id,
    kind: 'linked',
    status: link.status,
    name: link.traineeName,
    goal: link.traineeGoal,
    level: link.traineeLevel,
    days: link.traineeDays,
    place: link.traineePlace,
    note: link.coachNote,
    program: link.program,
    menu: link.menu ?? null,
    done: activity?.done ?? 0,
    planned,
    lastActive: activity?.lastActive ?? link.updatedAt,
    traineeUid: link.traineeUid,
  };
}

export function fromLocal(trainee: Trainee): RosterEntry {
  return {
    id: trainee.id,
    kind: 'local',
    status: 'active',
    name: trainee.name,
    goal: trainee.goal,
    level: trainee.level,
    days: trainee.days,
    place: trainee.place,
    note: trainee.note,
    program: trainee.program,
    menu: trainee.menu ?? null,
    done: trainee.done,
    planned: trainee.planned,
    lastActive: trainee.lastActive,
    demo: trainee.demo,
  };
}

/* ------------------------------------------------------------------ */
/* Real activity                                                       */
/* ------------------------------------------------------------------ */

export type Activity = { done: number; lastActive: number };

const NO_ACTIVITY: Map<string, Activity> = new Map();

/**
 * Recent training for each linked trainee.
 *
 * One small query per person rather than a single wide one: the rules grant a
 * coach read access per trainee, so there is no collection that spans them.
 * Only the last four weeks are fetched, which is all the roster reports.
 */
export function useActivity(links: Links): Map<string, Activity> {
  const uids = useMemo(
    () =>
      links.asCoach
        .filter((l) => l.status === 'active')
        .map((l) => l.traineeUid)
        .sort()
        .join(','),
    [links.asCoach],
  );

  // Stamped with the roster it was fetched for, so a changed roster reads as
  // "not loaded yet" during render rather than being cleared from an effect.
  const [fetched, setFetched] = useState<{ key: string; map: Map<string, Activity> } | null>(null);

  useEffect(() => {
    const db = getDb();
    const list = uids ? uids.split(',') : [];
    if (!db || !list.length) return;

    let alive = true;
    const since = Date.now() - FOUR_WEEKS;

    Promise.all(
      list.map(async (uid) => {
        try {
          const snapshot = await getDocs(
            query(collection(db, 'users', uid, 'logs'), where('startedAt', '>=', since)),
          );
          const logs = snapshot.docs.map((d) => d.data() as WorkoutLog);
          const lastActive = logs.reduce((max, log) => Math.max(max, log.startedAt), 0);
          return [uid, { done: logs.length, lastActive }] as const;
        } catch {
          // A revoked link fails here, which is the point of the rule.
          return [uid, { done: 0, lastActive: 0 }] as const;
        }
      }),
    ).then((entries) => {
      if (alive) setFetched({ key: uids, map: new Map(entries) });
    });

    return () => {
      alive = false;
    };
  }, [uids]);

  return fetched && fetched.key === uids ? fetched.map : NO_ACTIVITY;
}

/** How much of the plan is actually happening, 0 to 1. */
export function adherenceOf(entry: RosterEntry) {
  return entry.planned ? Math.min(entry.done / entry.planned, 1) : 0;
}

export function adherenceTone(value: number): 'ok' | 'warn' | 'bad' {
  if (value >= 0.8) return 'ok';
  if (value >= 0.55) return 'warn';
  return 'bad';
}
