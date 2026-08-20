"use client";

import Link from "next/link";
import { percentComplete, useProgressMap } from "@/lib/progress";
import { DifficultyMeter } from "./DifficultyMeter";

export interface CurriculumItem {
  slug: string;
  title: string;
  tagline: string;
  difficulty: 1 | 2 | 3;
  /** Whether a lesson has been authored for this concept yet. */
  built: boolean;
  minutes?: number;
  steps?: number;
}

export interface CurriculumModuleView {
  name: string;
  summary: string;
  entries: CurriculumItem[];
}

/**
 * The full syllabus for a track. Concepts with a lesson are playable; the rest
 * are shown in place so the path ahead is visible rather than implied.
 */
export function CurriculumList({
  track,
  modules,
}: {
  track: string;
  modules: CurriculumModuleView[];
}) {
  const progress = useProgressMap();

  // Concepts are numbered continuously across the whole track, so each module
  // needs the count of everything before it. Derived, not accumulated during
  // render — a counter mutated inside JSX drifts on re-render.
  const startIndex = modules.map((_, i) =>
    modules.slice(0, i).reduce((n, m) => n + m.entries.length, 0),
  );

  return (
    <div className="flex flex-col gap-10">
      {modules.map((module, moduleIndex) => {
        const built = module.entries.filter((e) => e.built).length;

        return (
          <section key={module.name} aria-label={module.name}>
            <header className="mb-3 border-b border-border pb-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-lg font-medium text-ink">
                  <span className="mr-2 font-mono text-[0.6875rem] text-muted">
                    {String(moduleIndex + 1).padStart(2, "0")}
                  </span>
                  {module.name}
                </h2>
                <span className="font-mono text-[0.6875rem] text-muted">
                  {built} of {module.entries.length} live
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{module.summary}</p>
            </header>

            <ol className="flex flex-col">
              {module.entries.map((entry, entryIndex) => {
                const number = String(startIndex[moduleIndex] + entryIndex + 1).padStart(2, "0");

                if (!entry.built) {
                  return (
                    <li
                      key={entry.slug}
                      className="grid grid-cols-[2.5rem_1fr] items-start gap-x-3 border-b border-border/60 py-3 sm:gap-x-5"
                    >
                      <span className="font-mono text-sm tabular-nums text-muted/60">{number}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="font-display text-[1.0625rem] font-medium text-muted">
                            {entry.title}
                          </h3>
                          <span className="rounded-sm border border-border px-1.5 py-px font-mono text-[0.5625rem] uppercase tracking-wide text-muted">
                            upcoming
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted">{entry.tagline}</p>
                      </div>
                    </li>
                  );
                }

                const entryProgress = progress[entry.slug];
                const percent = percentComplete(entryProgress);

                return (
                  <li key={entry.slug}>
                    <Link
                      href={`/${track}/${entry.slug}`}
                      className="group grid grid-cols-[2.5rem_1fr] items-start gap-x-3 border-b border-border py-4 transition-colors hover:bg-steel-wash/40 sm:grid-cols-[3rem_1fr_auto] sm:gap-x-5"
                    >
                      <span className="font-mono text-sm tabular-nums text-muted">{number}</span>

                      <div className="min-w-0">
                        <h3 className="font-display text-[1.0625rem] font-medium text-ink group-hover:text-steel-ink">
                          {entry.title}
                        </h3>
                        <p className="mt-0.5 text-sm leading-relaxed text-text">{entry.tagline}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-muted">
                          <DifficultyMeter level={entry.difficulty} />
                          {entry.minutes !== undefined && <span>{entry.minutes} min</span>}
                          {entry.steps !== undefined && <span>{entry.steps} steps</span>}
                          {entryProgress?.completed && (
                            <span className="inline-flex items-center gap-1 text-green-ink">
                              <CheckIcon /> done
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 mt-3 sm:col-span-1 sm:mt-1 sm:w-28">
                        <ProgressBar percent={percent} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 flex-1 overflow-hidden rounded-[1px] bg-border-strong/40"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress through this concept"
      >
        <div
          className={`h-full transition-[width] duration-500 ${percent === 100 ? "bg-green" : "bg-steel"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-[0.625rem] tabular-nums text-muted">
        {percent}%
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M1.5 5.2 3.8 7.5 8.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
