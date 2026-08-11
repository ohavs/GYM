'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { animationUrl, thumbUrl } from '@/lib/data';
import { TINT_ART, tintFor, type Tint } from '@/components/ui/controls';
import type { Exercise } from '@/lib/types';

/**
 * The exercise figure is the app's photography. It sits directly on a tint,
 * blended so the source artwork's white plate disappears and the figure reads
 * as a cutout on the card.
 *
 * The plate is an `art` tint, which stays light in dark mode. Multiply against
 * a dark surface subtracts the figure into the background and leaves an empty
 * coloured box, so the artwork keeps its own daylight in both themes.
 *
 * Thumbnails ship with the app so a card paints instantly; the 90 KB animation
 * loads only where it earns its bytes, and a missing CDN just leaves the still.
 */
export function ExerciseMedia({
  exercise,
  animate = false,
  tint,
  className = '',
}: {
  exercise: Exercise;
  animate?: boolean;
  tint?: Tint;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const surface = TINT_ART[tint ?? tintFor(exercise.id)];

  return (
    <div className={`relative overflow-hidden ${surface} ${className}`}>
      {/* Plain img on purpose: the sources are already 180x180, so the image
          optimizer would add a round trip without shrinking anything. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl(exercise.m)}
        alt={exercise.he}
        loading="lazy"
        decoding="async"
        className="art art-blend"
      />
      {animate && !failed && (
        <motion.img
          src={animationUrl(exercise.m)}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
          className="art art-blend absolute inset-0"
        />
      )}
    </div>
  );
}
