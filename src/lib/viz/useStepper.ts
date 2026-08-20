"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface StepperOptions {
  length: number;
  autoPlay?: boolean;
  loop?: boolean;
  intervalMs?: number;
  /** When false, playback never advances — used for reduced-motion visitors. */
  enabled?: boolean;
  onChange?: (index: number) => void;
}

export interface Stepper {
  index: number;
  length: number;
  playing: boolean;
  atStart: boolean;
  atEnd: boolean;
  go: (index: number) => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  setPlaying: (playing: boolean) => void;
  toggle: () => void;
}

/** Drives every step-through on the site. One source of truth for playback. */
export function useStepper({
  length,
  autoPlay = false,
  loop = false,
  intervalMs = 2400,
  enabled = true,
  onChange,
}: StepperOptions): Stepper {
  const [rawIndex, setIndex] = useState(0);
  const [playRequested, setPlaying] = useState(autoPlay);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Clamped on read rather than corrected in an effect, so a shrinking `length`
  // can never leave a stale index in state.
  const last = Math.max(length - 1, 0);
  const index = Math.min(rawIndex, last);

  const atStart = index === 0;
  const atEnd = index === last;

  // Derived, not stored: reaching the end of a non-looping sequence simply
  // stops playback, with no effect needed to notice it happened.
  const playing = playRequested && enabled && (loop || !atEnd);

  const go = useCallback(
    (n: number) => {
      setIndex((prev) => {
        const next = Math.min(Math.max(n, 0), Math.max(length - 1, 0));
        if (next !== prev) onChangeRef.current?.(next);
        return next;
      });
    },
    [length],
  );

  const next = useCallback(() => {
    setIndex((prev) => {
      if (prev >= length - 1) {
        if (!loop) return prev;
        onChangeRef.current?.(0);
        return 0;
      }
      onChangeRef.current?.(prev + 1);
      return prev + 1;
    });
  }, [length, loop]);

  const prev = useCallback(() => go(index - 1), [go, index]);
  const restart = useCallback(() => go(0), [go]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(next, intervalMs);
    return () => window.clearTimeout(id);
  }, [playing, index, intervalMs, next]);

  return {
    index,
    length,
    playing,
    atStart,
    atEnd,
    go,
    next,
    prev,
    restart,
    setPlaying,
    toggle,
  };
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** True when the visitor has asked for reduced motion. SSR-safe. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}
