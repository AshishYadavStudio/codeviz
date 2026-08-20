"use client";

import { useSyncExternalStore } from "react";

export interface LessonProgress {
  /** Highest stage index reached. */
  lastStage: number;
  /** Total stages at the time it was recorded. */
  stages: number;
  completed: boolean;
  updatedAt: number;
}

export type ProgressMap = Record<string, LessonProgress>;

/**
 * Progress is local-only at launch — no accounts, no login friction.
 *
 * It goes through this interface rather than touching localStorage directly so
 * a server-backed implementation can be dropped in when accounts arrive,
 * without touching a single component.
 */
export interface ProgressBackend {
  read(): ProgressMap;
  write(map: ProgressMap): void;
  subscribe(listener: () => void): () => void;
}

const KEY = "codeviz.progress.v1";
const EMPTY: ProgressMap = {};

let cache: ProgressMap | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

const localBackend: ProgressBackend = {
  read() {
    if (cache) return cache;
    if (typeof window === "undefined") return EMPTY;
    try {
      const raw = window.localStorage.getItem(KEY);
      cache = raw ? (JSON.parse(raw) as ProgressMap) : {};
    } catch {
      cache = {};
    }
    return cache;
  },

  write(map) {
    cache = map;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(map));
    } catch {
      // Private browsing / quota — progress is a convenience, never a blocker.
    }
    emit();
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

const backend: ProgressBackend = localBackend;

/** Records the furthest stage a visitor has reached in a lesson. */
export function recordStage(slug: string, stage: number, stages: number) {
  const map = backend.read();
  const prev = map[slug];
  const lastStage = Math.max(prev?.lastStage ?? 0, stage);
  const completed = (prev?.completed ?? false) || stage >= stages - 1;

  if (prev && prev.lastStage === lastStage && prev.completed === completed) return;

  backend.write({
    ...map,
    [slug]: { lastStage, stages, completed, updatedAt: Date.now() },
  });
}

export function resetProgress() {
  backend.write({});
}

/**
 * Subscribes to the whole map. Returns a stable reference between writes, so
 * components can index it without re-rendering on every commit.
 */
export function useProgressMap(): ProgressMap {
  return useSyncExternalStore(
    backend.subscribe,
    () => backend.read(),
    () => EMPTY,
  );
}

export function percentComplete(entry: LessonProgress | undefined): number {
  if (!entry || entry.stages <= 1) return entry?.completed ? 100 : 0;
  if (entry.completed) return 100;
  return Math.round((entry.lastStage / (entry.stages - 1)) * 100);
}
