"use client";

import { useMemo } from "react";
import type { Scene } from "@/lib/viz/types";
import { MemoryGrid } from "@/components/viz/MemoryGrid";
import { StepControls } from "@/components/viz/StepControls";
import { usePrefersReducedMotion, useStepper } from "@/lib/viz/useStepper";

const VALUES = [10, 20, 30, 40, 50];
const BASE = 0x1000;

const hex = (n: number) => `0x${n.toString(16)}`;

/** `int *p = arr;` then `p++` — the shortest possible demo of the whole idea. */
function frame(step: number): Scene {
  return {
    regions: [
      {
        id: "stack",
        kind: "stack",
        label: "Stack",
        frames: [
          {
            id: "main",
            label: "main()",
            state: "active",
            badge: step === 0 ? "int *p = arr;" : `p++;  // ${step}`,
            cells: [
              ...VALUES.map((value, i) => ({
                id: `arr${i}`,
                name: `arr[${i}]`,
                value: String(value),
                address: hex(BASE + i * 4),
                state: i === step ? ("active" as const) : ("idle" as const),
                row: 0,
              })),
              {
                id: "p",
                name: "p",
                type: "int *",
                value: hex(BASE + step * 4),
                address: "0x1020",
                state: "read" as const,
                // own row: the arrow then rises through empty space
                row: 1,
              },
            ],
          },
        ],
      },
    ],
    arrows: [{ id: "p-arrow", from: "p", to: `arr${step}`, state: "active", label: "*p" }],
    callout: {
      tone: "active",
      text: `*p is ${VALUES[step]} — the pointer moved ${step * 4} bytes, not ${step} bytes, because it points at ints.`,
    },
  };
}

export function HeroDemo() {
  const scenes = useMemo(() => VALUES.map((_, i) => frame(i)), []);
  const reducedMotion = usePrefersReducedMotion();

  const stepper = useStepper({
    length: scenes.length,
    autoPlay: true,
    loop: true,
    intervalMs: 2000,
    // Resolves to false during SSR and flips on the client, so playback is
    // gated by it rather than by the initial autoPlay value.
    enabled: !reducedMotion,
  });

  return (
    <div
      className="flex flex-col gap-2"
      // Pause while the visitor is reading or interacting with it.
      onMouseEnter={() => stepper.setPlaying(false)}
      onFocusCapture={() => stepper.setPlaying(false)}
    >
      <MemoryGrid
        scene={scenes[stepper.index]}
        summary={`Pointer p references arr[${stepper.index}], value ${VALUES[stepper.index]}.`}
      />
      <StepControls
        stepper={stepper}
        labels={VALUES.map((v, i) => `arr[${i}] = ${v}`)}
        compact
      />
    </div>
  );
}
