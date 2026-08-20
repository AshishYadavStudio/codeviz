"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Lesson } from "@/lib/viz/types";
import { useStepper } from "@/lib/viz/useStepper";
import { recordStage } from "@/lib/progress";
import { languageExtension } from "@/lib/code/tokenize";
import { RichText } from "@/components/ui/RichText";
import { MemoryGrid } from "./MemoryGrid";
import { StepControls } from "./StepControls";
import { CodePane } from "./CodePane";

/**
 * A concept page is not an article — it is a sequence of stages the learner
 * steps through, with prose, code and memory advancing together. Explanation
 * left, live visualization right on desktop; visualization first on mobile,
 * which is why it comes first in the DOM and is placed into column two.
 */
export function ConceptPlayer({ lesson }: { lesson: Lesson }) {
  const stages = lesson.stages;
  const rootRef = useRef<HTMLDivElement>(null);

  const stepper = useStepper({
    length: stages.length,
    onChange: (i) => recordStage(lesson.slug, i, stages.length),
  });

  const stage = stages[stepper.index];
  const labels = stages.map((s) => s.title);

  // Opening the page counts as reaching stage 0.
  useEffect(() => {
    recordStage(lesson.slug, 0, stages.length);
  }, [lesson.slug, stages.length]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepper.next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepper.prev();
    } else if (event.key === "Home") {
      event.preventDefault();
      stepper.go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      stepper.go(stages.length - 1);
    }
  }

  return (
    <div
      ref={rootRef}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="group"
      aria-roledescription="step-through walkthrough"
      aria-label={`${lesson.title} — use the left and right arrow keys to step`}
      className="grid gap-6 outline-none lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8"
    >
      {/* Visualization — column two on desktop, first on mobile.
          min-w-0 lets the canvas scroll inside itself instead of widening the page. */}
      <div className="min-w-0 lg:col-start-2 lg:row-start-1">
        <div className="flex flex-col gap-2 lg:sticky lg:top-20">
          <MemoryGrid
            scene={stage.scene}
            summary={`Step ${stepper.index + 1} of ${stages.length}. ${stage.title}. ${stage.body.join(" ")}`}
          />
          <StepControls stepper={stepper} labels={labels} />
        </div>
      </div>

      {/* Explanation */}
      <div className="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-start-1">
        <div>
          <p className="cv-eyebrow mb-2">
            Step {String(stepper.index + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}
          </p>
          <h2 className="text-[1.375rem] leading-snug sm:text-2xl">{stage.title}</h2>
        </div>

        <div className="flex flex-col gap-3 text-[0.9375rem] leading-relaxed">
          {stage.body.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>

        {stage.code && (
          <CodePane
            code={stage.code}
            activeLines={stage.activeLines}
            language={lesson.language}
            filename={lesson.filename ?? `${lesson.slug}.${languageExtension(lesson.language)}`}
          />
        )}

        <StageNav stepper={stepper} labels={labels} />
      </div>
    </div>
  );
}

function StageNav({
  stepper,
  labels,
}: {
  stepper: ReturnType<typeof useStepper>;
  labels: string[];
}) {
  const prevLabel = labels[stepper.index - 1];
  const nextLabel = labels[stepper.index + 1];

  return (
    <div className="mt-1 flex items-stretch gap-2 border-t border-border pt-4">
      <button
        type="button"
        onClick={stepper.prev}
        disabled={stepper.atStart}
        className="flex-1 rounded-[var(--radius-card)] border border-border px-3 py-2 text-left transition-colors hover:border-steel disabled:pointer-events-none disabled:opacity-40"
      >
        <span className="cv-eyebrow block">← Back</span>
        <span className="mt-0.5 block truncate text-sm text-ink">{prevLabel ?? "Start"}</span>
      </button>

      <button
        type="button"
        onClick={stepper.next}
        disabled={stepper.atEnd}
        className="flex-1 rounded-[var(--radius-card)] border border-border px-3 py-2 text-right transition-colors hover:border-steel disabled:pointer-events-none disabled:opacity-40"
      >
        <span className="cv-eyebrow block">Next step →</span>
        <span className="mt-0.5 block truncate text-sm text-ink">{nextLabel ?? "Done"}</span>
      </button>
    </div>
  );
}
