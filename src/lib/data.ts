'use client';

import type { Exercise, Meta } from './types';

/**
 * The exercise index (350 KB) is fetched once and cached in module scope.
 * Instruction steps (625 KB) load only when a user opens an exercise sheet.
 */

let indexPromise: Promise<{ exercises: Exercise[]; meta: Meta }> | null = null;
let stepsPromise: Promise<Record<string, string[]>> | null = null;

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = Promise.all([
      fetch('/data/exercises.json').then((r) => r.json() as Promise<Exercise[]>),
      fetch('/data/meta.json').then((r) => r.json() as Promise<Meta>),
    ]).then(([exercises, meta]) => ({ exercises, meta }));
  }
  return indexPromise;
}

export function loadSteps() {
  if (!stepsPromise) {
    stepsPromise = fetch('/data/steps.json').then(
      (r) => r.json() as Promise<Record<string, string[]>>,
    );
  }
  return stepsPromise;
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

/**
 * Thumbnails ship with the app; animations stream from a CDN so the repo does
 * not carry 126 MB of GIFs. Point NEXT_PUBLIC_MEDIA_CDN at your own bucket
 * once you have licensed the media directly from Gym visual.
 */
const CDN =
  process.env.NEXT_PUBLIC_MEDIA_CDN ||
  'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';

export const thumbUrl = (mediaId: string) => `/media/img/${mediaId}.jpg`;
export const animationUrl = (mediaId: string) => `${CDN}/videos/${mediaId}.gif`;

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export type Filters = {
  q: string;
  bodyParts: string[];
  equipment: string[];
  levels: number[];
};

export const emptyFilters: Filters = { q: '', bodyParts: [], equipment: [], levels: [] };

export const filterCount = (f: Filters) =>
  f.bodyParts.length + f.equipment.length + f.levels.length;

/** Hebrew search tolerates the optional final-letter forms and stray niqqud. */
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ')
    .replace(/["'`׳״]/g, '')
    .trim();
}

export function searchExercises(
  all: Exercise[],
  meta: Meta,
  filters: Filters,
  limit = Infinity,
): Exercise[] {
  const q = normalize(filters.q);
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const bp = new Set(filters.bodyParts);
  const eq = new Set(filters.equipment);
  const lv = new Set(filters.levels);

  const out: Exercise[] = [];
  for (const ex of all) {
    if (bp.size && !bp.has(ex.bp)) continue;
    if (eq.size && !eq.has(ex.eq)) continue;
    if (lv.size && !lv.has(ex.lvl)) continue;
    if (terms.length) {
      const hay = normalize(
        `${ex.he} ${ex.en} ${meta.targets[ex.tg] ?? ''} ${meta.muscles[ex.mg] ?? ''}`,
      );
      if (!terms.every((t) => hay.includes(t))) continue;
    }
    out.push(ex);
    if (out.length >= limit) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Equipment availability                                              */
/* ------------------------------------------------------------------ */

const MINIMAL = new Set(['body weight', 'dumbbell', 'band', 'resistance band', 'kettlebell']);

export function allowedEquipment(place: string, meta: Meta): Set<string> {
  if (place === 'gym') return new Set(meta.equipment.map((e) => e.key));
  if (place === 'minimal') return MINIMAL;
  return new Set(meta.equipment.filter((e) => e.home).map((e) => e.key));
}
