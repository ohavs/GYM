'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import {
  BookmarkSimple,
  Cards,
  FunnelSimple,
  Lightning,
  MagnifyingGlass,
  Rows,
  Sparkle,
  SquaresFour,
  Sun,
  X,
} from '@phosphor-icons/react/dist/ssr';
import { Rise, Screen } from '@/components/layout/screen';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button, IconButton } from '@/components/ui/button';
import {
  Chip,
  EmptyState,
  SearchField,
  TINT_BG,
  tintFor,
  useDebounced,
  type Tint,
} from '@/components/ui/controls';
import { Dropdown, MenuAction, MenuItem } from '@/components/ui/menu';
import { Sheet } from '@/components/ui/sheet';
import { ExerciseCard, ExerciseRow } from '@/components/exercise/exercise-card';
import { ExerciseMedia } from '@/components/exercise/exercise-media';
import { ExerciseSheet } from '@/components/exercise/exercise-sheet';
import { useReadyCatalog } from '@/components/app-providers';
import { emptyFilters, filterCount, searchExercises, type Filters } from '@/lib/data';
import { useStore, type LibraryView } from '@/lib/store';
import { LEVEL_LABEL } from '@/lib/program';
import { haptic } from '@/lib/haptics';
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
  const view = useStore((s) => s.libraryView);
  const setView = useStore((s) => s.setLibraryView);

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

  const stamps = useFilterStamps(exercises);

  const active = filterCount(filters);
  // The menu leads with the areas people actually browse, not alphabetical order.
  const topBodyParts = [...meta.bodyParts].sort(
    (a, b) => (meta.counts.bodyPart[b.key] ?? 0) - (meta.counts.bodyPart[a.key] ?? 0),
  );

  // One pick reads better as its own name than as a category with a badge.
  const areaLabel =
    filters.bodyParts.length === 1
      ? (meta.bodyParts.find((bp) => bp.key === filters.bodyParts[0])?.he ?? 'אזור בגוף')
      : 'אזור בגוף';

  return (
    <Screen>
      <Rise>
        <header className="flex items-start gap-3 pt-4 pb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-[32px] leading-[1.08]">מאגר התרגילים</h1>
            <p className="mt-2 text-[15px] text-muted">
              <span className="font-medium text-ink">{meta.total.toLocaleString('he-IL')}</span>{' '}
              תרגילים עם הדגמה מונפשת, שריר מטרה והוראות ביצוע.
            </p>
          </div>
          <ThemeToggle />
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
              <span className="digits pointer-events-none absolute -top-1 -end-1 grid size-5.5 place-items-center rounded-full bg-red text-[10px] font-semibold text-on-ink">
                {active}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2.5">
          <Dropdown
            title="אזור בגוף"
            label={areaLabel}
            count={filters.bodyParts.length}
            onClear={() => setFilters((f) => ({ ...f, bodyParts: [] }))}
            footer={
              <MenuAction
                icon={<FunnelSimple size={15} weight="bold" />}
                onClick={() => setFiltersOpen(true)}
              >
                ציוד ורמת קושי
              </MenuAction>
            }
          >
            {topBodyParts.map((bp) => (
              <MenuItem
                key={bp.key}
                selected={filters.bodyParts.includes(bp.key)}
                count={meta.counts.bodyPart[bp.key]}
                label={bp.he}
                leading={<Stamp exercise={stamps.byBodyPart.get(bp.key)} className="size-10" />}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    bodyParts: f.bodyParts.includes(bp.key)
                      ? f.bodyParts.filter((x) => x !== bp.key)
                      : [...f.bodyParts, bp.key],
                  }))
                }
              />
            ))}
          </Dropdown>

          <Chip active={onlySaved} onClick={() => setOnlySaved((v) => !v)} count={saved.length}>
            <ChipGlyph tint="sky">
              <BookmarkSimple size={16} weight={onlySaved ? 'fill' : 'bold'} />
            </ChipGlyph>
            שמורים
          </Chip>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-1 pb-4">
        <p className="text-[13px] text-faint">
          <span className="font-medium text-muted">{results.length.toLocaleString('he-IL')}</span>{' '}
          תוצאות
        </p>
        <ViewSwitcher value={view} onChange={setView} />
      </div>

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
          {view === 'grid' && (
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
          )}

          {view === 'large' && (
            <div className="flex flex-col gap-3.5">
              {results.slice(0, visible).map((exercise, i) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={i % PAGE}
                  onOpen={setOpen}
                  wide
                />
              ))}
            </div>
          )}

          {view === 'list' && (
            <ul className="flex flex-col gap-2">
              {results.slice(0, visible).map((exercise) => (
                <li key={exercise.id}>
                  <ExerciseRow
                    dense
                    exercise={exercise}
                    detail={`${meta.targets[exercise.tg] ?? exercise.tg} · ${
                      meta.equipment.find((e) => e.key === exercise.eq)?.chip ?? exercise.eq
                    }`}
                    onClick={() => setOpen(exercise)}
                    trailing={<SaveToggle id={exercise.id} />}
                  />
                </li>
              ))}
            </ul>
          )}
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
        stamps={stamps}
      />

      <ExerciseSheet exercise={open} onClose={() => setOpen(null)} />
    </Screen>
  );
}

const VIEWS: { value: LibraryView; label: string; Icon: typeof Rows }[] = [
  { value: 'grid', label: 'רשת', Icon: SquaresFour },
  { value: 'list', label: 'רשימה', Icon: Rows },
  { value: 'large', label: 'גדול', Icon: Cards },
];

function ViewSwitcher({
  value,
  onChange,
}: {
  value: LibraryView;
  onChange: (view: LibraryView) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-[var(--shadow-soft)]">
      {VIEWS.map(({ value: option, label, Icon }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-label={`תצוגת ${label}`}
            aria-pressed={active}
            onClick={() => {
              haptic('select');
              onChange(option);
            }}
            className="relative grid size-9 place-items-center rounded-full"
          >
            {active && (
              <motion.span
                layoutId="library-view"
                transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                className="absolute inset-0 rounded-full bg-ink"
              />
            )}
            {/* Bold in both states: the filled weights collapse these shapes
                into solid slabs, and the layout they stand for disappears. */}
            <Icon
              size={17}
              weight="bold"
              className={`relative z-10 ${active ? 'text-on-ink' : 'text-faint'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

function SaveToggle({ id }: { id: string }) {
  const saved = useStore((s) => s.saved.includes(id));
  const toggleSaved = useStore((s) => s.toggleSaved);
  return (
    <button
      type="button"
      aria-label={saved ? 'הסרה מהשמורים' : 'שמירה'}
      aria-pressed={saved}
      onClick={(e) => {
        e.stopPropagation();
        haptic('select');
        toggleSaved(id);
      }}
      className={`me-1 grid size-9 shrink-0 place-items-center rounded-full transition-colors ${
        saved ? 'bg-ink text-on-ink' : 'bg-canvas text-faint'
      }`}
    >
      <BookmarkSimple size={15} weight={saved ? 'fill' : 'regular'} />
    </button>
  );
}

/**
 * Every filter is stamped with the most mainstream exercise it selects, so a
 * row of categories reads as pictures of movements rather than words alone.
 */
function useFilterStamps(exercises: Exercise[]) {
  return useMemo(() => {
    const byBodyPart = new Map<string, Exercise>();
    const byEquipment = new Map<string, Exercise>();
    for (const ex of exercises) {
      const bp = byBodyPart.get(ex.bp);
      if (!bp || ex.rank > bp.rank) byBodyPart.set(ex.bp, ex);
      const eq = byEquipment.get(ex.eq);
      if (!eq || ex.rank > eq.rank) byEquipment.set(ex.eq, ex);
    }
    return { byBodyPart, byEquipment };
  }, [exercises]);
}

/**
 * Artwork stamp for one filter. Big enough that the figure still reads — any
 * smaller and it turns to mush. A rounded square rather than a circle: the
 * artwork is blended onto its tint, and a blended layer paints straight through
 * a round clip, so limbs and barbells escape the disc.
 */
function Stamp({ exercise, className = '' }: { exercise?: Exercise; className?: string }) {
  if (!exercise) return null;
  return (
    <ExerciseMedia
      exercise={exercise}
      tint={tintFor(exercise.id)}
      className={`shrink-0 rounded-[var(--radius-xs)] p-0.5 ${className}`}
    />
  );
}

/** Same medallion shape as Stamp, for filters with no artwork to show. */
function ChipGlyph({ tint, children }: { tint: Tint; children: React.ReactNode }) {
  return (
    <span
      className={`-ms-3 grid size-9 shrink-0 place-items-center rounded-[var(--radius-xs)] text-ink ${TINT_BG[tint]}`}
    >
      {children}
    </span>
  );
}

const LEVELS = [
  { value: 1, Icon: Sun, tint: 'mint' },
  { value: 2, Icon: Lightning, tint: 'butter' },
  { value: 3, Icon: Sparkle, tint: 'blush' },
] as const;

function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  meta,
  resultCount,
  stamps,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (filters: Filters) => void;
  meta: ReturnType<typeof useReadyCatalog>['meta'];
  resultCount: number;
  stamps: ReturnType<typeof useFilterStamps>;
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
              <Stamp exercise={stamps.byBodyPart.get(bp.key)} className="-ms-3 size-9" />
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
                <Stamp exercise={stamps.byEquipment.get(eq.key)} className="-ms-3 size-9" />
                {eq.chip}
              </Chip>
            ))}
        </FilterGroup>

        <FilterGroup title="רמת קושי">
          {LEVELS.map(({ value: level, Icon, tint }) => (
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
              <ChipGlyph tint={tint}>
                <Icon size={17} weight="bold" />
              </ChipGlyph>
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
