'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { Goal, Level, Place, Program } from './types';

/**
 * The coach ↔ trainee link.
 *
 * One document per pair, at a deterministic id, holding everything the two of
 * them share. Nobody writes into anybody else's data: the coach writes the
 * program here, the trainee reads it here, and the trainee's own logs stay in
 * their own subtree with the coach granted read access for as long as this
 * document exists.
 */
export type LinkStatus = 'pending' | 'active';

export type CoachLink = {
  id: string;
  coachUid: string;
  traineeUid: string;
  /** Both uids. The only shape a Firestore list query can be authorised for. */
  members: string[];
  status: LinkStatus;
  inviteCode: string;

  coachName: string;
  coachNote: string;

  traineeName: string;
  traineeGoal: Goal;
  traineeLevel: Level;
  traineeDays: number;
  traineePlace: Place;

  program: Program | null;
  createdAt: number;
  updatedAt: number;
};

/** What the trainee publishes about themselves when they join. */
export type TraineeCard = Pick<
  CoachLink,
  'traineeName' | 'traineeGoal' | 'traineeLevel' | 'traineeDays' | 'traineePlace'
>;

const linkId = (coachUid: string, traineeUid: string) => `${coachUid}_${traineeUid}`;

/* ------------------------------------------------------------------ */
/* Invite codes                                                        */
/* ------------------------------------------------------------------ */

/**
 * Unambiguous alphabet: no O/0, no I/1/L. The code gets read aloud and typed
 * by hand often enough that the confusable pairs are worth losing.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/**
 * The coach's standing join code.
 *
 * One reusable code rather than an invitation per trainee: it removes a race
 * from the rules, and it matches how a coach actually works — one link, sent
 * to everyone who joins. The coach still approves each request, so a leaked
 * code is a nuisance rather than a way in.
 */
export async function ensureInvite(coachUid: string, coachName: string) {
  const db = getDb();
  if (!db) return null;

  const mine = doc(db, 'users', coachUid);
  const snapshot = await getDoc(mine);
  const existing = snapshot.data()?.inviteCode as string | undefined;

  if (existing) {
    // Keep the name fresh, so an old code still introduces the coach correctly.
    await setDoc(doc(db, 'invites', existing), { coachUid, coachName }, { merge: true });
    return existing;
  }

  const code = newCode();
  await setDoc(doc(db, 'invites', code), { coachUid, coachName, createdAt: Date.now() });
  await setDoc(mine, { inviteCode: code }, { merge: true });
  return code;
}

/** Replaces the code, so anything already shared stops working. */
export async function rotateInvite(coachUid: string, coachName: string, previous?: string) {
  const db = getDb();
  if (!db) return null;
  const code = newCode();
  await setDoc(doc(db, 'invites', code), { coachUid, coachName, createdAt: Date.now() });
  await setDoc(doc(db, 'users', coachUid), { inviteCode: code }, { merge: true });
  if (previous) await deleteDoc(doc(db, 'invites', previous)).catch(() => {});
  return code;
}

export type Invite = { code: string; coachUid: string; coachName: string };

/** Looks a code up. Codes can be fetched one by one, never listed. */
export async function findInvite(code: string): Promise<Invite | null> {
  const db = getDb();
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'invites', code.trim().toUpperCase()));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { code: snapshot.id, coachUid: data.coachUid, coachName: data.coachName ?? 'המאמן' };
}

/* ------------------------------------------------------------------ */
/* Joining and managing                                                */
/* ------------------------------------------------------------------ */

export async function requestLink(invite: Invite, traineeUid: string, card: TraineeCard) {
  const db = getDb();
  if (!db) return;
  const id = linkId(invite.coachUid, traineeUid);
  const now = Date.now();
  await setDoc(doc(db, 'links', id), {
    coachUid: invite.coachUid,
    traineeUid,
    members: [invite.coachUid, traineeUid],
    status: 'pending' satisfies LinkStatus,
    inviteCode: invite.code,
    coachName: invite.coachName,
    coachNote: '',
    ...card,
    program: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function approveLink(id: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'links', id), { status: 'active', updatedAt: Date.now() });
}

export async function endLink(id: string) {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'links', id));
}

export async function assignProgram(id: string, program: Program | null) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'links', id), { program, updatedAt: Date.now() });
}

export async function setCoachNote(id: string, coachNote: string) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'links', id), { coachNote, updatedAt: Date.now() });
}

/** Keeps the card the coach sees in step with the trainee's own settings. */
export async function refreshTraineeCard(id: string, card: TraineeCard) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'links', id), { ...card, updatedAt: Date.now() });
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

export type Links = {
  /** False until the first snapshot arrives, or immediately for a guest. */
  ready: boolean;
  /** People this account trains. */
  asCoach: CoachLink[];
  /** Coaches training this account. */
  asTrainee: CoachLink[];
};

const EMPTY: Links = { ready: true, asCoach: [], asTrainee: [] };

/**
 * Live view of every link this account is part of.
 *
 * A subscription rather than a fetch: a coach changing a program should land
 * on the trainee's phone without them doing anything, and an approval should
 * land on the trainee's while they are still looking at the screen.
 */
export function useLinks(uid: string | null): Links {
  // Stamped with the account it belongs to, so signing out cannot leave the
  // previous person's roster on screen and no effect has to clear it.
  const [snapshot, setSnapshot] = useState<{ uid: string; list: CoachLink[] } | null>(null);

  useEffect(() => {
    const db = getDb();
    if (!uid || !db) return;

    const q = query(collection(db, 'links'), where('members', 'array-contains', uid));
    return onSnapshot(
      q,
      (result) =>
        setSnapshot({
          uid,
          list: result.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CoachLink, 'id'>) })),
        }),
      () => setSnapshot({ uid, list: [] }),
    );
  }, [uid]);

  const links = snapshot && snapshot.uid === uid ? snapshot.list : null;

  return useMemo(() => {
    if (!uid) return EMPTY;
    if (!links) return { ready: false, asCoach: [], asTrainee: [] };
    return {
      ready: true,
      asCoach: links
        .filter((l) => l.coachUid === uid)
        .sort((a, b) => Number(a.status === 'active') - Number(b.status === 'active')),
      asTrainee: links.filter((l) => l.traineeUid === uid),
    };
  }, [links, uid]);
}

/** The one coach whose program is live for this trainee, if any. */
export function activeCoach(links: Links) {
  return links.asTrainee.find((l) => l.status === 'active') ?? null;
}
