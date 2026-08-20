"use client";

import type { Stepper } from "@/lib/viz/useStepper";

interface Props {
  stepper: Stepper;
  /** Stage titles — used for scrub-segment labels and tooltips. */
  labels?: string[];
  compact?: boolean;
  className?: string;
}

/**
 * The signature control. It appears under every visualization on the site, in
 * the same shape, so "step through it" becomes the one interaction visitors
 * have to learn. Amber marks the current position — the live step.
 */
export function StepControls({ stepper, labels = [], compact = false, className }: Props) {
  const { index, length, playing, atStart, atEnd } = stepper;

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface",
        compact ? "px-2 py-1.5" : "px-3 py-2",
        className ?? "",
      ].join(" ")}
      role="group"
      aria-label="Step through the visualization"
    >
      <div className="flex items-center gap-1">
        <ControlButton
          onClick={stepper.prev}
          disabled={atStart}
          label="Previous step"
          compact={compact}
        >
          <TriangleIcon direction="left" />
        </ControlButton>

        <ControlButton
          onClick={atEnd && !playing ? stepper.restart : stepper.toggle}
          label={atEnd && !playing ? "Replay from the start" : playing ? "Pause" : "Play"}
          live={playing}
          compact={compact}
        >
          {atEnd && !playing ? (
            <ReplayIcon />
          ) : playing ? (
            <PauseIcon />
          ) : (
            <TriangleIcon direction="right" />
          )}
        </ControlButton>

        <ControlButton
          onClick={stepper.next}
          disabled={atEnd}
          label="Next step"
          compact={compact}
        >
          <TriangleIcon direction="right" />
        </ControlButton>
      </div>

      {/* Scrub bar: one segment per step, each directly clickable. */}
      <div className="flex min-w-0 flex-1 items-center gap-px">
        {Array.from({ length }, (_, i) => {
          const state = i === index ? "current" : i < index ? "visited" : "ahead";
          return (
            <button
              key={i}
              type="button"
              onClick={() => stepper.go(i)}
              aria-label={`Step ${i + 1} of ${length}${labels[i] ? `: ${labels[i]}` : ""}`}
              aria-current={i === index ? "step" : undefined}
              title={labels[i]}
              className={[
                "group relative min-w-0 flex-1 rounded-[1px] transition-colors duration-200",
                compact ? "h-1.5" : "h-2",
                state === "current"
                  ? "bg-amber"
                  : state === "visited"
                    ? "bg-steel/70 hover:bg-steel"
                    : "bg-border-strong/45 hover:bg-border-strong",
              ].join(" ")}
            >
              {/* widen the hit target without widening the visual */}
              <span className="absolute inset-x-0 -inset-y-2" aria-hidden />
            </button>
          );
        })}
      </div>

      <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-muted">
        {String(index + 1).padStart(2, "0")}
        <span className="text-border-strong"> / </span>
        {String(length).padStart(2, "0")}
      </span>
    </div>
  );
}

function ControlButton({
  onClick,
  disabled,
  label,
  live,
  compact,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  live?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "flex items-center justify-center rounded border transition-colors duration-150",
        compact ? "h-6 w-6" : "h-7 w-7",
        disabled
          ? "cursor-not-allowed border-border text-border-strong"
          : live
            ? "border-amber bg-amber-wash text-amber-ink"
            : "border-border bg-bg text-ink hover:border-steel hover:text-steel-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function TriangleIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden>
      {direction === "right" ? <path d="M0 0l9 5-9 5z" /> : <path d="M9 0L0 5l9 5z" />}
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="3" height="10" />
      <rect x="6" y="0" width="3" height="10" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M10.5 6a4.5 4.5 0 1 1-1.6-3.44" strokeLinecap="round" />
      <path d="M10.8 1v2.2H8.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
