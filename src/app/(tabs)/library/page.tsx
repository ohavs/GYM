'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { BookmarkSimple, FunnelSimple, MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen } from '@/components/layout/screen';
import { Button, IconButton } from '@/components/ui/button';
import { Chip, EmptyState, SearchField, useDebounced } from '@/components/ui/controls';
import { Sheet } from '@/components/ui/sheet';
import { ExerciseCard } from '@/components/exercise/exercise-card';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { emptyFilters, filterCount, searchExercises, type Filters } from '@/lib/data';
import { useStore } from '@/lib/store';
import { LEVEL_LABEL } from '@/lib/program';
import type { Exercise } from '@/lib/types';

const PAGE = 24;

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <Library />
    </Suspense>
  );
}

function Library() {
  const params = useSearchParams();
  const { exercises, meta } = useReadyCatalog();
  const saved = useStore((s) => s.saved);

  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [onlySaved, setOnlySaved] = useState(params.get('saved') === '1');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [open, setOpen] = useState<Exercise | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const query = useDebounced(filters.q, 160);

  const results = useMemo(() => {
    const base = onlySaved ? exercises.filter((ex) => saved.includes(ex.id)) : exercises;
    return searchExercises(base, meta, { ...filters, q: query });
  }, [exercises, meta, filters, query, onlySaved, saved]);

  // A new result set means a new first page. Adjusting during render beats an
  // effect here: the grid never paints the old page length for a frame.
  const resultKey = `${query}|${filters.bodyParts}|${filters.equipment}|${filters.levels}|${onlySaved}`;
  const [lastKey, setLastKey] = useState(resultKey);
  if (lastKey !== resultKey) {
    setLastKey(resultKey);
    setVisible(PAGE);
  }

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible((v) => Math.min(v + PAGE, results.length));
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [results.length]);

  const active = filterCount(filters);
  // Quick chips lead with the areas people actually browse, not alphabetical order.
  const topBodyParts = [...meta.bodyParts]
    .filter((bp) => bp.key !== 'neck')
    .sort((a, b) => (meta.counts.bodyPart[b.key] ?? 0) - (meta.counts.bodyPart[a.key] ?? 0));

  return (
    <Screen>
      <Rise>
        <header className="pt-4 pb-6">
          <h1 className="text-[32px] leading-[1.08]">מאגר התרגילים</h1>
          <p className="mt-2 text-[15px] text-muted">
            <span className="font-medium text-ink">{meta.total.toLocaleString('he-IL')}</span>{' '}
            תרגילים עם הדגמה מונפשת, שריר מטרה והוראות ביצוע.
          </p>
        </header>
      </Rise>

      <div className="sticky top-0 z-20 -mx-5 bg-canvas/92 px-5 pb-4 pt-1 backdrop-blur-xl">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <SearchField
              value={filters.q}
              onChange={(q) => setFilters((f) => ({ ...f, q }))}
              placeholder="חיפוש תרגיל, שריר או ציוד"
            />
          </div>
          <div className="relative">
            <IconButton
              label="סינון"
              onClick={() => setFiltersOpen(true)}
              className="size-14"
              tone={active ? 'ink' : 'card'}
            >
              <FunnelSimple size={19} weight="bold" />
            </IconButton>
            {active > 0 && (
              <span className="digits pointer-events-none absolute -top-1 -end-1 grid size-5.5 place-items-center rounded-full bg-red text-[10px] font-semibold text-white">
                {active}
              </span>
            )}
          </div>
        </div>

        <div className="no-scrollbar -mx-5 mt-3 flex gap-2.5 overflow-x-auto px-5">
          <Chip active={onlySaved} onClick={() => setOnlySaved((v) => !v)} count={saved.length}>
            <BookmarkSimple size={14} weight={onlySaved ? 'fill' : 'bold'} />
            שמורים
          </Chip>
          {topBodyParts.map((bp) => (
            <Chip
              key={bp.key}
              active={filters.bodyParts.includes(bp.key)}
              count={meta.counts.bodyPart[bp.key]}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  bodyParts: f.bodyParts.includes(bp.key)
                    ? f.bodyParts.filter((x) => x !== bp.key)
                    : [...f.bodyParts, bp.key],
                }))
              }
            >
              {bp.he}
            </Chip>
          ))}
        </div>
      </div>

      <p className="px-1 pb-4 text-[13px] text-faint">
        <span className="font-medium text-muted">{results.length.toLocaleString('he-IL')}</span>{' '}
        תוצאות
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon={<MagnifyingGlass size={30} />}
          title="לא מצאנו תרגילים כאלה"
          body="נסו מונח אחר, או הסירו חלק מהסינונים כדי לפתוח את החיפוש."
          action={
            <Button
              size="lg"
              onClick={() => {
                setFilters(emptyFilters);
                setOnlySaved(false);
              }}
            >
              איפוס סינון
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3.5">
            {results.slice(0, visible).map((exercise, i) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={i % PAGE}
                onOpen={setOpen}
              />
            ))}
          </div>
          <div ref={sentinel} className="h-10" />
          {visible < results.length && (
            <p className="pb-4 text-center text-[13px] text-faint">טוענים עוד תרגילים...</p>
          )}
        </>
      )}

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        meta={meta}
        resultCount={results.length}
      />

      <ExerciseSheet exercise={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  meta,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (filters: Filters) => void;
  meta: ReturnType<typeof useReadyCatalog>['meta'];
  resultCount: number;
}) {
  const toggle = (key: 'bodyParts' | 'equipment', value: string) =>
    onChange({
      ...filters,
      [key]: filters[key].includes(value)
        ? filters[key].filter((x) => x !== value)
        : [...filters[key], value],
    });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="סינון"
      subtitle="אפשר לבחור כמה אפשרויות יחד"
      footer={
        <div className="flex gap-3">
          <Button
            variant="card"
            size="lg"
            className="flex-1"
            onClick={() => onChange({ ...emptyFilters, q: filters.q })}
          >
            ניקוי
          </Button>
          <Button size="lg" className="flex-[2]" onClick={onClose}>
            הצגת <span className="digits">{resultCount}</span> תוצאות
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-7 py-2">
        <FilterGroup title="אזור בגוף">
          {meta.bodyParts.map((bp) => (
            <Chip
              key={bp.key}
              active={filters.bodyParts.includes(bp.key)}
              count={meta.counts.bodyPart[bp.key]}
              onClick={() => toggle('bodyParts', bp.key)}
            >
              {bp.he}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup title="ציוד">
          {meta.equipment
            .filter((eq) => (meta.counts.equipment[eq.key] ?? 0) > 0)
            .sort((a, b) => (meta.counts.equipment[b.key] ?? 0) - (meta.counts.equipment[a.key] ?? 0))
            .map((eq) => (
              <Chip
                key={eq.key}
                active={filters.equipment.includes(eq.key)}
                count={meta.counts.equipment[eq.key]}
                onClick={() => toggle('equipment', eq.key)}
              >
                {eq.chip}
              </Chip>
            ))}
        </FilterGroup>

        <FilterGroup title="רמת קושי">
          {([1, 2, 3] as const).map((level) => (
            <Chip
              key={level}
              active={filters.levels.includes(level)}
              onClick={() =>
                onChange({
                  ...filters,
                  levels: filters.levels.includes(level)
                    ? filters.levels.filter((x) => x !== level)
                    : [...filters.levels, level],
                })
              }
            >
              {LEVEL_LABEL[level]}
            </Chip>
          ))}
        </FilterGroup>

        {filterCount(filters) > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onChange({ ...emptyFilters, q: filters.q })}
            className="flex items-center justify-center gap-1.5 text-[14px] font-medium text-muted"
          >
            <X size={14} weight="bold" />
            ניקוי כל הסינונים
          </motion.button>
        )}
      </div>
    </Sheet>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 px-1 text-[17px]">{title}</h3>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </section>
  );
}
