'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { animationUrl, thumbUrl } from '@/lib/data';
import type { Exercise } from '@/lib/types';

/**
 * Thumbnails ship with the app, so a card always paints instantly. The 90 KB
 * animation loads only where it earns its bytes: the detail sheet and the
 * workout player. If the CDN is unreachable the thumbnail simply stays.
 */
export function ExerciseMedia({
  exercise,
  animate = false,
  className = '',
  sizes = '180px',
}: {
  exercise: Exercise;
  animate?: boolean;
  className?: string;
  sizes?: string;
}) {
  const [animationReady, setAnimationReady] = useState(false);
  const [animationFailed, setAnimationFailed] = useState(false);

  return (
    <div className={`exercise-media relative overflow-hidden ${className}`}>
      {/* Plain img on purpose: the sources are already 180x180, so the image
          optimizer would add a round trip and cost without shrinking anything. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl(exercise.m)}
        alt={exercise.he}
        loading="lazy"
        decoding="async"
        sizes={sizes}
        className="size-full object-contain"
      />
      {animate && !animationFailed && (
        <motion.img
          src={animationUrl(exercise.m)}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: animationReady ? 1 : 0 }}
          transition={{ duration: 0.35 }}
          onLoad={() => setAnimationReady(true)}
          onError={() => setAnimationFailed(true)}
          className="absolute inset-0 size-full object-contain"
        />
      )}
    </div>
  );
}
