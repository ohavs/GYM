'use client';

import { motion } from 'motion/react';
import { Check, Moon, Sun, DeviceMobile } from '@phosphor-icons/react/dist/ssr';
import { Segmented } from '@/components/ui/controls';
import { useStore } from '@/lib/store';
import { haptic } from '@/lib/haptics';
import { PALETTES, THEMES, type ThemeChoice } from '@/lib/theme';

const THEME_ICON: Record<ThemeChoice, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: DeviceMobile,
};

/**
 * Theme and palette picker.
 *
 * Each swatch paints itself with the palette it stands for, by scoping the
 * palette attribute to the chip. There is no second copy of the colours to
 * keep in step: what the chip shows is what the app will use.
 */
export function Appearance() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const palette = useStore((s) => s.palette);
  const setPalette = useStore((s) => s.setPalette);

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex items-center gap-2 px-1">
          {(() => {
            const Icon = THEME_ICON[theme];
            return <Icon size={16} weight="bold" className="text-muted" />;
          })()}
          <p className="text-[14px] font-medium">מראה</p>
        </div>
        <Segmented
          value={theme}
          options={THEMES}
          size="sm"
          onChange={(next) => setTheme(next as ThemeChoice)}
        />
      </div>

      <div className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-soft)]">
        <p className="mb-3 px-1 text-[14px] font-medium">ערכת צבעים</p>
        <ul className="flex flex-col gap-2">
          {PALETTES.map((option) => (
            <li key={option.value}>
              <PaletteRow
                option={option}
                selected={option.value === palette}
                onSelect={() => {
                  haptic('select');
                  setPalette(option.value);
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PaletteRow({
  option,
  selected,
  onSelect,
}: {
  option: (typeof PALETTES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 460, damping: 32 }}
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full items-center gap-3.5 rounded-[var(--radius-md)] p-2.5 text-start transition-colors ${
        selected ? 'bg-canvas' : ''
      }`}
    >
      {/* The chip carries the palette attribute, so it renders in that
          palette's own colours whatever the app is currently set to — and
          pins itself to light, where the palettes actually differ. */}
      <span
        data-palette={option.value}
        data-theme="light"
        className="grid size-12 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-[var(--radius-xs)] border border-line-strong"
      >
        <span className="bg-peach" />
        <span className="bg-mint" />
        <span className="bg-sky" />
        <span className="bg-blush" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{option.label}</span>
        <span className="block truncate text-[12.5px] text-muted">{option.note}</span>
      </span>

      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${
          selected ? 'bg-ink text-on-ink' : 'border-[1.5px] border-line-strong'
        }`}
      >
        {selected && <Check size={13} weight="bold" />}
      </span>
    </motion.button>
  );
}
