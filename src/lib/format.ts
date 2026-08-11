const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HE_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function mmss(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function durationLabel(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} דק׳`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} שע׳ ${m} דק׳` : `${h} שע׳`;
}

export function volumeLabel(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} טון`;
  return `${Math.round(kg)} ק״ג`;
}

export function dayName(ts: number) {
  return HE_DAYS[new Date(ts).getDay()];
}

export function shortDate(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`;
}

export function relativeDay(ts: number) {
  const start = (n: number) => {
    const d = new Date(n);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const diff = Math.round((start(Date.now()) - start(ts)) / 86_400_000);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'אתמול';
  if (diff < 7) return `לפני ${diff} ימים`;
  if (diff < 14) return 'לפני שבוע';
  if (diff < 31) return `לפני ${Math.floor(diff / 7)} שבועות`;
  return shortDate(ts);
}

export function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
  return name ? `${part}, ${name}` : part;
}

/** Sunday-anchored week key, matching how Israeli training weeks are counted. */
export function weekKey(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

/**
 * Deterministic avatar hue, confined to the ember arc (red through amber) so
 * a roster of trainees stays distinguishable without turning into a rainbow
 * next to the single accent colour.
 */
export function avatarHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return 8 + (h % 52);
}

export function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}
