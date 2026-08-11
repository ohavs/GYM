type Pattern = 'tap' | 'select' | 'success' | 'warn' | 'heavy';

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  select: 12,
  success: [14, 40, 22],
  warn: [10, 60, 10, 60, 10],
  heavy: 26,
};

/**
 * Vibration is a progressive enhancement: iOS Safari ignores it, everything
 * else gets a small physical confirmation on the actions that matter.
 */
export function haptic(pattern: Pattern = 'tap') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // A browser that refuses vibration is not an error worth surfacing.
  }
}
