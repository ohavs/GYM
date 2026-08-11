'use client';

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb, watchAuth, type User } from './firebase';
import { useStore } from './store';
import type { Profile, Program, Trainee, WorkoutLog } from './types';

/**
 * Firestore layout
 *
 *   users/{uid}                     profile, program, saved, lastWeights, active
 *   users/{uid}/logs/{logId}        one document per finished workout
 *   users/{uid}/trainees/{id}       coach roster, each with its own program
 *
 * Logs and trainees are subcollections rather than arrays on the user document,
 * so a long history never approaches the 1 MB document limit and can be paged
 * or queried later without rewriting the storage shape.
 */

type UserDoc = {
  profile: Profile;
  program: Program | null;
  saved: string[];
  lastWeights: Record<string, number>;
  updatedAt: number;
};

export type SyncStatus = 'guest' | 'loading' | 'synced' | 'offline';

async function pull(uid: string) {
  const db = getDb();
  if (!db) return null;

  const [snapshot, logSnap, traineeSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDocs(collection(db, 'users', uid, 'logs')),
    getDocs(collection(db, 'users', uid, 'trainees')),
  ]);

  if (!snapshot.exists()) return null;

  const base = snapshot.data() as UserDoc;
  return {
    ...base,
    logs: logSnap.docs
      .map((d) => d.data() as WorkoutLog)
      .sort((a, b) => b.startedAt - a.startedAt),
    trainees: traineeSnap.docs.map((d) => d.data() as Trainee),
  };
}

async function pushUserDoc(uid: string, value: UserDoc) {
  const db = getDb();
  if (!db) return;
  await setDoc(doc(db, 'users', uid), value, { merge: true });
}

async function pushCollection<T extends { id: string }>(
  uid: string,
  name: 'logs' | 'trainees',
  items: T[],
  knownIds: Set<string>,
) {
  const db = getDb();
  if (!db) return;

  const batch = writeBatch(db);
  const currentIds = new Set(items.map((item) => item.id));

  for (const item of items) {
    if (knownIds.has(item.id)) continue;
    batch.set(doc(db, 'users', uid, name, item.id), item);
  }
  for (const id of knownIds) {
    if (!currentIds.has(id)) batch.delete(doc(db, 'users', uid, name, id));
  }
  await batch.commit();
}

/**
 * Binds the local store to the signed-in user's Firestore document.
 *
 * First sign-in adopts whatever the guest session already built, so nobody
 * loses a program by creating an account. After that the remote copy wins on
 * load, and local edits are written back on a short debounce.
 */
export function useFirebaseSync() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>('guest');
  const ready = useRef(false);
  const knownLogs = useRef<Set<string>>(new Set());
  const knownTrainees = useRef<Set<string>>(new Set());

  useEffect(() => watchAuth(setUser), []);

  useEffect(() => {
    ready.current = false;
    knownLogs.current = new Set();
    knownTrainees.current = new Set();

    let alive = true;

    // Wrapped in a task so the status write lands outside the effect body,
    // which keeps the first paint free of a cascading re-render.
    const started = Promise.resolve().then(() => {
      if (!alive) return;
      setStatus(user ? 'loading' : 'guest');
    });

    if (!user) {
      return () => {
        alive = false;
      };
    }

    void started.then(async () => {
      try {
        const remote = await pull(user.uid);
        if (!alive) return;

        if (remote) {
          useStore.setState({
            profile: { ...remote.profile, onboarded: remote.profile.onboarded ?? false },
            program: remote.program ?? null,
            saved: remote.saved ?? [],
            lastWeights: remote.lastWeights ?? {},
            logs: remote.logs,
            trainees: remote.trainees,
          });
          knownLogs.current = new Set(remote.logs.map((l) => l.id));
          knownTrainees.current = new Set(remote.trainees.map((t) => t.id));
        } else {
          // New account: keep what this device already has and seed the doc.
          const s = useStore.getState();
          const name = s.profile.name || user.displayName?.split(' ')[0] || '';
          useStore.setState({ profile: { ...s.profile, name } });
          await pushUserDoc(user.uid, {
            profile: { ...s.profile, name },
            program: s.program,
            saved: s.saved,
            lastWeights: s.lastWeights,
            updatedAt: Date.now(),
          });
          await pushCollection(user.uid, 'logs', s.logs, new Set());
          await pushCollection(user.uid, 'trainees', s.trainees, new Set());
          knownLogs.current = new Set(s.logs.map((l) => l.id));
          knownTrainees.current = new Set(s.trainees.map((t) => t.id));
        }

        if (alive) {
          ready.current = true;
          setStatus('synced');
        }
      } catch {
        if (alive) setStatus('offline');
        ready.current = true;
      }
    });

    return () => {
      alive = false;
    };
  }, [user]);

  // Write-behind: batch local edits into one round trip per idle second.
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useStore.subscribe((state) => {
      if (!ready.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await pushUserDoc(user.uid, {
            profile: state.profile,
            program: state.program,
            saved: state.saved,
            lastWeights: state.lastWeights,
            updatedAt: Date.now(),
          });
          await pushCollection(user.uid, 'logs', state.logs, knownLogs.current);
          await pushCollection(user.uid, 'trainees', state.trainees, knownTrainees.current);
          knownLogs.current = new Set(state.logs.map((l) => l.id));
          knownTrainees.current = new Set(state.trainees.map((t) => t.id));
          setStatus('synced');
        } catch {
          setStatus('offline');
        }
      }, 900);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [user]);

  return { user, status };
}

/** Wipes the signed-in user's remote copy, used by the reset action. */
export async function deleteRemoteData(uid: string) {
  const db = getDb();
  if (!db) return;
  for (const name of ['logs', 'trainees'] as const) {
    const snap = await getDocs(collection(db, 'users', uid, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  }
  await deleteDoc(doc(db, 'users', uid));
}
