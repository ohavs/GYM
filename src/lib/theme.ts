'use client';

/**
 * Theme and palette.
 *
 * Both live as data attributes on <html>, which is the only place they exist:
 * the stylesheet keys every colour off them, so nothing has to be re-rendered
 * for a switch to land, and nothing can be missed.
 */

export type ThemeChoice = 'system' | 'light' | 'dark';
export type PaletteKey = 'lilac' | 'sand' | 'sea' | 'forest' | 'rose';

export const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'בהיר' },
  { value: 'dark', label: 'כהה' },
  { value: 'system', label: 'לפי המכשיר' },
];

/**
 * Swatches are the palette's own tokens, so the picker cannot drift from what
 * the palette actually paints — each chip is rendered with the real variables.
 */
export const PALETTES: { value: PaletteKey; label: string; note: string }[] = [
  { value: 'lilac', label: 'לילך', note: 'רגוע ונקי' },
  { value: 'sand', label: 'חול', note: 'חמים ורך' },
  { value: 'sea', label: 'ים', note: 'קריר וצלול' },
  { value: 'forest', label: 'יער', note: 'ירוק וטבעי' },
  { value: 'rose', label: 'ורד', note: 'עדין ואנרגטי' },
];

export const DEFAULT_PALETTE: PaletteKey = 'lilac';

/**
 * Applied to the document root. Kept as a plain function rather than an effect
 * so the boot script and React can call the exact same code path.
 */
export function applyTheme(theme: ThemeChoice, palette: PaletteKey) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  root.setAttribute('data-palette', palette);

  // The browser chrome should match the canvas, not a colour frozen at build
  // time, or the status bar sits in the wrong theme on every switch.
  const canvas = getComputedStyle(root).getPropertyValue('--canvas').trim();
  if (canvas) {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = canvas;
  }
}

/**
 * Runs before first paint, from a blocking inline script.
 *
 * Without it the app paints light, then corrects itself once React hydrates —
 * a white flash on every cold open in dark mode, which is exactly the moment a
 * phone is being used in the dark.
 */
export const BOOT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('maslul-state');
    var s = raw ? (JSON.parse(raw).state || {}) : {};
    var theme = s.theme || 'system';
    var palette = s.palette || '${DEFAULT_PALETTE}';
    var dark = theme === 'dark' || (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-palette', palette);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-palette', '${DEFAULT_PALETTE}');
  }
})();
`.trim();
