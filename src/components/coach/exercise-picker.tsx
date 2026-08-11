'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import { Sheet } from '@/components/ui/sheet';
import { Chip, EmptyState, SearchField, useDebounced } from '@/components/ui/controls';
import { ExerciseRow } from '@/components/exercise/exercise-card';
import { useReadyCatalog } from '@/components/app-providers';
import { allowedEquipment, searchExercises } from '@/lib/data';
import type { Exercise, Place } from '@/lib/types';

/** Library picker constrained to the equipment the trainee actually has. */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  place,
  excludeIds = [],
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
  place: Place;
  excludeIds?: string[];
}) {
  const { exercises, meta } = useReadyCatalog();
  const [q, setQ] = useState('');
  const [bodyPart, setBodyPart] = useState<string | null>(null);
  const query = useDebounced(q, 160);

  const results = useMemo(() => {
    const allowed = allowedEquipment(place, meta);
    const excluded = new Set(excludeIds);
    const base = exercises.filter((ex) => allowed.has(ex.eq) && !excluded.has(ex.id));
    return searchExercises(base, meta, {
      q: query,
      bodyParts: bodyPart ? [bodyPart] : [],
      equipment: [],
      levels: [],
    }).slice(0, 60);
  }, [exercises, meta, query, bodyPart, place, excludeIds]);

  return (
    <Sheet open={open} onClose={onClose} title="הוספת תרגיל" full>
      <div className="sticky top-0 z-10 -mx-5 bg-bg-elev px-5 pb-3 pt-1">
        <SearchField value={q} onChange={setQ} placeholder="חיפוש תרגיל או שריר" />
        <div className="no-scrollbar -mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5">
          <Chip active={bodyPart === null} onClick={() => setBodyPart(null)}>
            הכל
          </Chip>
          {meta.bodyParts.map((bp) => (
            <Chip
              key={bp.key}
              active={bodyPart === bp.key}
              onClick={() => setBodyPart(bodyPart === bp.key ? null : bp.key)}
            >
              {bp.he}
            </Chip>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={24} />}
          title="אין תוצאות"
          body="נסו מונח אחר או שנו את אזור הגוף."
        />
      ) : (
        <ul className="flex flex-col gap-2 pb-4">
          {results.map((exercise) => (
            <li key={exercise.id}>
              <ExerciseRow
                exercise={exercise}
                meta={meta}
                detail={`${meta.targets[exercise.tg] ?? exercise.tg} · ${
                  meta.equipment.find((e) => e.key === exercise.eq)?.chip ?? exercise.eq
                }`}
                onClick={() => {
                  onPick(exercise);
                  onClose();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
