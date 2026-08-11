/**
 * Builds the app dataset from the upstream exercises-dataset repository.
 *
 *   node scripts/build-dataset.mjs [path-to-dataset-repo]
 *
 * Outputs:
 *   public/data/exercises.json  slim index, loaded once at app start
 *   public/data/steps.json      original English instruction steps, lazy loaded
 *   public/data/meta.json       taxonomy + counts for filter UI
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  BODY_PARTS,
  EQUIPMENT,
  TARGETS,
  MUSCLES,
  NAME_NOISE,
  POSITIONS,
  GRIPS,
  VARIANTS,
  MOVEMENTS,
  TOKENS,
  STOPWORDS,
  PATTERN_CUES,
} from './hebrew-lexicon.mjs';

const SRC = process.argv[2] || '/workspace/hasaneyldrm/exercises-dataset';
const OUT = path.join(process.cwd(), 'public', 'data');

/* ------------------------------------------------------------------ */
/* Name translation                                                    */
/* ------------------------------------------------------------------ */

const LATERALITY = new Set([
  'ביד אחת',
  'ברגל אחת',
  'בשתי ידיים',
  'לסירוגין',
  'צד אחד',
]);

/** Tokens dropped when they merely restate the equipment field. */
const EQUIPMENT_TOKENS = {
  assisted: ['assisted'],
  band: ['band'],
  barbell: ['barbell'],
  'body weight': ['bodyweight', 'body', 'weight'],
  'bosu ball': ['bosu', 'ball'],
  cable: ['cable'],
  dumbbell: ['dumbbell', 'dumbbells'],
  'elliptical machine': ['elliptical', 'machine'],
  'ez barbell': ['ez', 'barbell', 'sz'],
  hammer: ['hammer'],
  kettlebell: ['kettlebell'],
  'leverage machine': ['lever', 'leverage', 'machine'],
  'medicine ball': ['medicine', 'ball'],
  'olympic barbell': ['olympic', 'barbell'],
  'resistance band': ['resistance', 'band'],
  roller: ['roller'],
  rope: ['rope'],
  'skierg machine': ['skierg', 'ski', 'machine'],
  'sled machine': ['sled', 'sledge', 'machine'],
  'smith machine': ['smith', 'machine'],
  'stability ball': ['stability', 'exercise', 'ball'],
  'stationary bike': ['stationary', 'bike'],
  'stepmill machine': ['stepmill', 'machine'],
  tire: ['tire'],
  'trap bar': ['trap', 'bar'],
  'upper body ergometer': ['upper', 'body', 'ergometer'],
  weighted: ['weighted'],
  'wheel roller': ['wheel', 'roller'],
};

/** Phrase keys are normalized the same way names are, so "push-up" matches "push up". */
const byPhraseLength = (list) => {
  const seen = new Set();
  return list
    .map(([phrase, ...rest]) => [phrase.replace(/-/g, ' '), ...rest])
    .filter(([phrase]) => (seen.has(phrase) ? false : seen.add(phrase)))
    .sort((a, b) => b[0].split(' ').length - a[0].split(' ').length);
};

const SORTED_MOVEMENTS = byPhraseLength(MOVEMENTS);
const SORTED_POSITIONS = byPhraseLength(POSITIONS);
const SORTED_GRIPS = byPhraseLength(GRIPS);
const SORTED_VARIANTS = byPhraseLength(VARIANTS);

function tokenize(name) {
  let s = ` ${name.toLowerCase()} `;
  for (const re of NAME_NOISE) s = s.replace(re, ' ');
  s = s
    .replace(/[()]/g, ' ')
    .replace(/[-_/,.]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.split(' ').filter(Boolean);
}

/** Finds every entry from `list` present in `tokens`, longest phrases first. */
function extract(tokens, list) {
  const used = new Array(tokens.length).fill(false);
  const found = [];
  for (const entry of list) {
    const phrase = entry[0].split(' ');
    for (let i = 0; i + phrase.length <= tokens.length; i++) {
      if (used[i]) continue;
      let hit = true;
      for (let j = 0; j < phrase.length; j++) {
        if (used[i + j] || tokens[i + j] !== phrase[j]) {
          hit = false;
          break;
        }
      }
      if (!hit) continue;
      for (let j = 0; j < phrase.length; j++) used[i + j] = true;
      found.push({ entry, start: i, end: i + phrase.length - 1 });
    }
  }
  found.sort((a, b) => a.start - b.start);
  const rest = tokens.filter((_, i) => !used[i]);
  return { found, rest };
}

/**
 * English compound nouns put the head last, so the movement that ends latest is
 * the exercise itself; anything after "with" or "on" is a qualifier, not a head.
 */
function pickCore(found, headLimit) {
  if (!found.length) return null;
  const inHead = found.filter((m) => m.end < headLimit);
  const pool = inHead.length ? inHead : found;
  return pool.reduce((best, m) => {
    if (m.end !== best.end) return m.end > best.end ? m : best;
    const len = (x) => x.entry[0].split(' ').length;
    return len(m) > len(best) ? m : best;
  }, pool[0]);
}

function joinGrips(grips) {
  if (!grips.length) return [];
  const [first, ...rest] = grips;
  return [
    [first, ...rest.map((g) => g.replace(/^אחיזה /, ''))].join(' '),
  ];
}

const unknownTokens = new Map();

function translateName(exercise) {
  const tokens = tokenize(exercise.name);
  const cut = tokens.findIndex((t) => t === 'with' || t === 'on');
  const headLimit = cut === -1 ? tokens.length : cut;

  const mv = extract(tokens, SORTED_MOVEMENTS);
  const core = pickCore(mv.found, headLimit);
  const extras = mv.found
    .filter((m) => m !== core && m.end < headLimit)
    .slice(0, 1)
    .map((m) => `עם ${m.entry[1]}`);

  const pos = extract(mv.rest, SORTED_POSITIONS);
  const grip = extract(pos.rest, SORTED_GRIPS);
  const varr = extract(grip.rest, SORTED_VARIANTS);

  const coreHe = core ? core.entry[1] : '';
  const equipmentNoise = new Set(EQUIPMENT_TOKENS[exercise.equipment] || []);
  const leftovers = [];
  for (const t of varr.rest) {
    if (equipmentNoise.has(t) || STOPWORDS.has(t)) continue;
    const word = TOKENS[t];
    if (word) {
      // Skip leftovers the core phrase already says ("ab rollerout" -> "גלגול בטן").
      if (!coreHe.includes(word)) leftovers.push(word);
      continue;
    }
    if (/^\d+$/.test(t) || t.length <= 2) continue;
    unknownTokens.set(t, (unknownTokens.get(t) || 0) + 1);
  }

  const variants = varr.found.map((m) => m.entry[1]);
  const laterality = variants.filter((v) => LATERALITY.has(v));
  const otherVariants = variants.filter((v) => !LATERALITY.has(v));

  const equipmentSuffix = EQUIPMENT[exercise.equipment]?.suffix || '';
  const parts = [
    coreHe || `תרגיל ${TARGETS[exercise.target] || BODY_PARTS[exercise.body_part].he}`,
    ...extras,
    ...leftovers,
    ...otherVariants,
    ...pos.found.map((m) => m.entry[1]),
    equipmentSuffix,
    ...joinGrips(grip.found.map((m) => m.entry[1])),
    ...laterality,
  ].filter(Boolean);

  const seen = new Set();
  const deduped = parts.filter((p) => (seen.has(p) ? false : seen.add(p)));
  const he = deduped.join(' ').replace(/\s+/g, ' ').trim();

  const pattern = core ? core.entry[2] : inferPattern(exercise);
  return { he, pattern };
}

function inferPattern(exercise) {
  if (exercise.body_part === 'cardio') return 'cardio';
  if (/stretch/.test(exercise.name)) return 'stretch';
  if (exercise.body_part === 'waist') return 'core';
  if (exercise.body_part === 'neck') return 'neck';
  if (exercise.body_part === 'lower legs') return 'calf';
  if (exercise.body_part === 'lower arms') return 'wrist';
  return 'general';
}

/* ------------------------------------------------------------------ */
/* Derived attributes                                                  */
/* ------------------------------------------------------------------ */

const COMPOUND_PATTERNS = new Set([
  'press-horizontal',
  'press-vertical',
  'squat',
  'hinge',
  'lunge',
  'row',
  'pulldown',
  'pullup',
  'pushup',
  'dip',
  'leg-press',
  'olympic',
  'hip-thrust',
]);

const TIMED_PATTERNS = new Set(['plank', 'stretch', 'cardio', 'carry', 'mobility']);

const ADVANCED_HINTS = /muscle up|planche|flag|pistol|snatch|clean|jerk|handstand|kipping|skin the cat|maltese|stalder|front lever|iron cross|sissy/;
const BEGINNER_EQUIPMENT = new Set([
  'leverage machine',
  'smith machine',
  'cable',
  'assisted',
  'band',
  'resistance band',
  'stationary bike',
  'elliptical machine',
  'roller',
]);

function levelOf(exercise, pattern) {
  if (ADVANCED_HINTS.test(exercise.name) || pattern === 'olympic') return 3;
  if (pattern === 'plyo') return 3;
  if (BEGINNER_EQUIPMENT.has(exercise.equipment)) return 1;
  if (pattern === 'stretch' || pattern === 'mobility') return 1;
  if (COMPOUND_PATTERNS.has(pattern) && exercise.equipment !== 'body weight') return 2;
  return exercise.equipment === 'body weight' ? 1 : 2;
}

/**
 * Ranks how "reachable" an exercise is, so search and the program builder
 * surface staples before novelty variations. Higher is more mainstream.
 */
function rankOf(exercise, pattern) {
  let score = 0;
  const eq = exercise.equipment;
  if (eq === 'barbell' || eq === 'dumbbell') score += 30;
  else if (eq === 'cable' || eq === 'leverage machine' || eq === 'body weight') score += 24;
  else if (eq === 'smith machine' || eq === 'kettlebell' || eq === 'ez barbell') score += 16;
  else if (eq === 'band' || eq === 'resistance band') score += 12;
  else score += 4;

  if (COMPOUND_PATTERNS.has(pattern)) score += 14;
  if (TIMED_PATTERNS.has(pattern)) score -= 6;

  const words = exercise.name.split(/\s+/).length;
  score -= Math.max(0, words - 3) * 3;
  if (/\bv\.?\s*\d/.test(exercise.name)) score -= 8;
  if (/male|female|pov/.test(exercise.name)) score -= 6;
  return score;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */

const raw = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'exercises.json'), 'utf8'));

const exercises = [];
const steps = {};

for (const ex of raw) {
  const { he, pattern } = translateName(ex);
  const mediaId = path.basename(ex.gif_url, '.gif');

  exercises.push({
    id: ex.id,
    he,
    en: ex.name,
    bp: ex.body_part,
    eq: ex.equipment,
    tg: ex.target,
    mg: ex.muscle_group,
    sec: ex.secondary_muscles,
    m: mediaId,
    pat: pattern,
    lvl: levelOf(ex, pattern),
    rank: rankOf(ex, pattern),
    comp: COMPOUND_PATTERNS.has(pattern) ? 1 : 0,
    timed: TIMED_PATTERNS.has(pattern) ? 1 : 0,
  });

  steps[ex.id] = ex.instruction_steps.en;
}

exercises.sort((a, b) => b.rank - a.rank || a.id.localeCompare(b.id));

const countBy = (key) =>
  exercises.reduce((acc, ex) => {
    acc[ex[key]] = (acc[ex[key]] || 0) + 1;
    return acc;
  }, {});

const meta = {
  total: exercises.length,
  attribution: raw[0].attribution,
  bodyParts: Object.entries(BODY_PARTS).map(([key, v]) => ({ key, ...v })),
  equipment: Object.entries(EQUIPMENT).map(([key, v]) => ({ key, ...v })),
  targets: TARGETS,
  muscles: MUSCLES,
  patterns: Object.fromEntries(
    Object.entries(PATTERN_CUES).map(([key, v]) => [key, v]),
  ),
  counts: {
    bodyPart: countBy('bp'),
    equipment: countBy('eq'),
    pattern: countBy('pat'),
  },
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'exercises.json'), JSON.stringify(exercises));
fs.writeFileSync(path.join(OUT, 'steps.json'), JSON.stringify(steps));
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));

/* ------------------------------------------------------------------ */
/* Coverage report                                                     */
/* ------------------------------------------------------------------ */

const size = (f) => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' KB';
const latin = exercises.filter((e) => /[a-z]{3,}/i.test(e.he.replace(/EZ|JM|V\b/g, '')));
const noPattern = exercises.filter((e) => e.pat === 'general');

console.log(`exercises      ${exercises.length}`);
console.log(`exercises.json ${size('exercises.json')}`);
console.log(`steps.json     ${size('steps.json')}`);
console.log(`meta.json      ${size('meta.json')}`);
console.log(`untranslated   ${latin.length}`);
console.log(`no pattern     ${noPattern.length}`);

if (process.env.VERBOSE) {
  console.log('\n--- unknown tokens ---');
  console.log(
    [...unknownTokens.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${t}:${c}`)
      .join(' '),
  );
  console.log('\n--- sample names ---');
  for (let i = 0; i < exercises.length; i += Math.floor(exercises.length / 40)) {
    console.log(exercises[i].he.padEnd(50), '|', exercises[i].en);
  }
}
