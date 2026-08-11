'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isDemoLog, isDemoTrainee } from './demo';
import { DEFAULT_PALETTE, type PaletteKey, type ThemeChoice } from './theme';
import type {
  ActiveWorkout,
  Block,
  Exercise,
  Profile,
  Program,
  Trainee,
  WorkoutLog,
} from './types';

export type LibraryView = 'grid' | 'list' | 'large';

const DEFAULT_PROFILE: Profile = {
  name: '',
  goal: 'muscle',
  level: 1,
  days: 3,
  place: 'gym',
  focus: [],
  role: 'trainee',
  onboarded: false,
};

type State = {
  profile: Profile;
  program: Program | null;
  logs: WorkoutLog[];
  active: ActiveWorkout | null;
  trainees: Trainee[];
  /** Exercise ids the user starred, shown first in the library. */
  saved: string[];
  /** How the catalogue is laid out. Remembered, since it is a lasting preference. */
  libraryView: LibraryView;
  theme: ThemeChoice;
  palette: PaletteKey;
  lastWeights: Record<string, number>;

  setProfile: (patch: Partial<Profile>) => void;
  setLibraryView: (view: LibraryView) => void;
  setTheme: (theme: ThemeChoice) => void;
  setPalette: (palette: PaletteKey) => void;
  setProgram: (program: Program | null) => void;
  toggleSaved: (id: string) => void;

  startWorkout: (program: Program, dayId: string, byId: Map<string, Exercise>) => void;
  updateSet: (exerciseIndex: number, setIndex: number, patch: Partial<{ weight: number; reps: number; done: boolean }>) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number) => void;
  swapExercise: (exerciseIndex: number, exerciseId: string) => void;
  setActiveIndex: (index: number) => void;
  finishWorkout: () => WorkoutLog | null;
  cancelWorkout: () => void;

  upsertTrainee: (trainee: Trainee) => void;
  removeTrainee: (id: string) => void;
  setTraineeProgram: (id: string, program: Program) => void;

  seedDemoHistory: (program: Program, byId: Map<string, Exercise>) => void;
  clearDemo: () => { logs: number; trainees: number };
  resetAll: () => void;
};

/** Heaviest set per exercise, rebuilt from history rather than accumulated. */
function heaviestByExercise(logs: WorkoutLog[]) {
  return logs.reduce<Record<string, number>>((acc, log) => {
    for (const entry of log.entries) {
      const heaviest = Math.max(...entry.sets.map((st) => st.weight));
      if (heaviest > 0) acc[entry.exerciseId] = Math.max(acc[entry.exerciseId] ?? 0, heaviest);
    }
    return acc;
  }, {});
}

const startingSets = (block: Block, lastWeight: number | undefined) =>
  Array.from({ length: block.sets }, () => ({
    weight: lastWeight ?? 0,
    reps: parseInt(block.reps, 10) || 10,
    done: false,
  }));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      program: null,
      logs: [],
      active: null,
      trainees: [],
      saved: [],
      libraryView: 'grid',
      theme: 'system',
      palette: DEFAULT_PALETTE,
      lastWeights: {},

      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setLibraryView: (libraryView) => set({ libraryView }),
      setTheme: (theme) => set({ theme }),
      setPalette: (palette) => set({ palette }),
      setProgram: (program) => set({ program }),

      toggleSaved: (id) =>
        set((s) => ({
          saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [id, ...s.saved],
        })),

      startWorkout: (program, dayId) => {
        const day = program.days.find((d) => d.id === dayId);
        if (!day) return;
        const { lastWeights } = get();
        set({
          active: {
            programId: program.id,
            dayId,
            dayName: day.name,
            startedAt: Date.now(),
            index: 0,
            entries: day.blocks.map((block) => ({
              exerciseId: block.exerciseId,
              sets: startingSets(block, lastWeights[block.exerciseId]),
            })),
          },
        });
      },

      updateSet: (exerciseIndex, setIndex, patch) =>
        set((s) => {
          if (!s.active) return s;
          const entries = s.active.entries.map((entry, i) =>
            i !== exerciseIndex
              ? entry
              : {
                  ...entry,
                  sets: entry.sets.map((st, j) => (j === setIndex ? { ...st, ...patch } : st)),
                },
          );
          return { active: { ...s.active, entries } };
        }),

      addSet: (exerciseIndex) =>
        set((s) => {
          if (!s.active) return s;
          const entries = s.active.entries.map((entry, i) => {
            if (i !== exerciseIndex) return entry;
            const last = entry.sets.at(-1);
            return {
              ...entry,
              sets: [...entry.sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 10, done: false }],
            };
          });
          return { active: { ...s.active, entries } };
        }),

      removeSet: (exerciseIndex) =>
        set((s) => {
          if (!s.active) return s;
          const entries = s.active.entries.map((entry, i) =>
            i !== exerciseIndex || entry.sets.length <= 1
              ? entry
              : { ...entry, sets: entry.sets.slice(0, -1) },
          );
          return { active: { ...s.active, entries } };
        }),

      swapExercise: (exerciseIndex, exerciseId) =>
        set((s) => {
          if (!s.active) return s;
          const entries = s.active.entries.map((entry, i) =>
            i === exerciseIndex ? { ...entry, exerciseId } : entry,
          );
          return { active: { ...s.active, entries } };
        }),

      setActiveIndex: (index) =>
        set((s) => (s.active ? { active: { ...s.active, index } } : s)),

      finishWorkout: () => {
        const { active, logs, lastWeights } = get();
        if (!active) return null;

        const entries = active.entries
          .map((entry) => ({ ...entry, sets: entry.sets.filter((st) => st.done) }))
          .filter((entry) => entry.sets.length > 0);

        if (!entries.length) {
          set({ active: null });
          return null;
        }

        const volume = entries.reduce(
          (sum, entry) => sum + entry.sets.reduce((s2, st) => s2 + st.weight * st.reps, 0),
          0,
        );
        const setCount = entries.reduce((sum, entry) => sum + entry.sets.length, 0);

        const nextWeights = { ...lastWeights };
        for (const entry of entries) {
          const heaviest = Math.max(...entry.sets.map((st) => st.weight));
          if (heaviest > 0) nextWeights[entry.exerciseId] = heaviest;
        }

        const log: WorkoutLog = {
          id: `log-${active.startedAt}`,
          programId: active.programId,
          dayId: active.dayId,
          dayName: active.dayName,
          startedAt: active.startedAt,
          endedAt: Date.now(),
          entries,
          volume,
          sets: setCount,
        };

        set({ active: null, logs: [log, ...logs], lastWeights: nextWeights });
        return log;
      },

      cancelWorkout: () => set({ active: null }),

      upsertTrainee: (trainee) =>
        set((s) => {
          const exists = s.trainees.some((t) => t.id === trainee.id);
          return {
            trainees: exists
              ? s.trainees.map((t) => (t.id === trainee.id ? trainee : t))
              : [trainee, ...s.trainees],
          };
        }),

      removeTrainee: (id) => set((s) => ({ trainees: s.trainees.filter((t) => t.id !== id) })),

      setTraineeProgram: (id, program) =>
        set((s) => ({
          trainees: s.trainees.map((t) => (t.id === id ? { ...t, program } : t)),
        })),

      seedDemoHistory: (program, byId) => {
        const day = 86_400_000;
        const now = Date.now();
        const logs: WorkoutLog[] = [];

        // Six weeks of sessions with a gentle upward trend and two missed weeks.
        for (let week = 5; week >= 0; week--) {
          const sessions = week === 3 ? 1 : Math.min(program.days.length, 3);
          for (let s = 0; s < sessions; s++) {
            const pd = program.days[s % program.days.length];
            const startedAt = now - week * 7 * day - (5 - s * 2) * day + 17 * 3600_000;
            const entries = pd.blocks.slice(0, 5).map((block) => {
              const ex = byId.get(block.exerciseId);
              const base = ex?.comp ? 42 : 14;
              const weight = Math.round((base + (5 - week) * (ex?.comp ? 2.5 : 1)) * 2) / 2;
              const reps = parseInt(block.reps, 10) || 10;
              return {
                exerciseId: block.exerciseId,
                sets: Array.from({ length: block.sets }, (_, i) => ({
                  weight,
                  reps: Math.max(4, reps - (i > 1 ? 1 : 0)),
                  done: true,
                })),
              };
            });
            const volume = entries.reduce(
              (sum, e) => sum + e.sets.reduce((s2, st) => s2 + st.weight * st.reps, 0),
              0,
            );
            logs.push({
              id: `demo-${week}-${s}`,
              demo: true,
              programId: program.id,
              dayId: pd.id,
              dayName: pd.name,
              startedAt,
              endedAt: startedAt + (48 + s * 4) * 60_000,
              entries,
              volume,
              sets: entries.reduce((sum, e) => sum + e.sets.length, 0),
            });
          }
        }

        // Real workouts are kept and merged in. Seeding used to replace the
        // whole history, which quietly threw away anything already recorded.
        set((state) => {
          const merged = [...state.logs.filter((log) => !isDemoLog(log)), ...logs].sort(
            (a, b) => b.startedAt - a.startedAt,
          );
          return { logs: merged, lastWeights: heaviestByExercise(merged) };
        });
      },

      clearDemo: () => {
        const { logs, trainees } = get();
        const keptLogs = logs.filter((log) => !isDemoLog(log));
        const keptTrainees = trainees.filter((trainee) => !isDemoTrainee(trainee));

        // Rebuilt from what survives: every finished workout leaves a log, so
        // dropping the samples must also drop the weights they suggested.
        set({
          logs: keptLogs,
          trainees: keptTrainees,
          lastWeights: heaviestByExercise(keptLogs),
        });

        return {
          logs: logs.length - keptLogs.length,
          trainees: trainees.length - keptTrainees.length,
        };
      },

      resetAll: () =>
        set({
          profile: DEFAULT_PROFILE,
          program: null,
          logs: [],
          active: null,
          trainees: [],
          saved: [],
          libraryView: 'grid',
          lastWeights: {},
          // Theme and palette survive: they are how the app looks, not data
          // the user asked to erase.
        }),
    }),
    {
      name: 'maslul-state',
      version: 1,
      partialize: (s) => ({
        profile: s.profile,
        program: s.program,
        logs: s.logs,
        active: s.active,
        trainees: s.trainees,
        saved: s.saved,
        libraryView: s.libraryView,
        theme: s.theme,
        palette: s.palette,
        lastWeights: s.lastWeights,
      }),
    },
  ),
);

/** Guards against reading persisted state during the server render. */
export function useHydrated() {
  // Reported as false on the server, so the markup matches the first client
  // pass, then read from the persist API, which is the external store here.
  return useSyncExternalStore(
    (onChange) => useStore.persist.onFinishHydration(onChange),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}
