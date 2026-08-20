"use client";

import type { Arrow } from "@/lib/viz/types";
import { arrowGeometry, selfLoopGeometry, type Box } from "@/lib/viz/geometry";

const STROKE: Record<NonNullable<Arrow["state"]>, string> = {
  idle: "var(--steel)",
  active: "var(--amber)", // a pointer being followed right now
  danger: "var(--danger)",
};

interface Props {
  arrows: Arrow[];
  boxes: Record<string, Box>;
  width: number;
  height: number;
}

/**
 * Pointers, drawn over the measured cell layout. Curves re-draw themselves
 * whenever a pointer is retargeted, which is the motion that makes `p++` and
 * `p = &x` legible.
 */
export function ArrowLayer({ arrows, boxes, width, height }: Props) {
  if (!width || !height) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      {arrows.map((arrow) => {
        const from = boxes[arrow.from];
        const to = boxes[arrow.to];
        if (!from || !to) return null;

        const { d, tip, mid } =
          arrow.from === arrow.to ? selfLoopGeometry(from) : arrowGeometry(from, to);
        const color = STROKE[arrow.state ?? "idle"];

        return (
          // Re-keying on the target replays the draw animation when a pointer moves.
          <g key={`${arrow.id}:${arrow.from}->${arrow.to}`} className="cv-arrow">
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={arrow.dashed ? "5 4" : undefined}
              pathLength={1}
              className={arrow.dashed ? undefined : "cv-arrow-draw"}
            />

            <path
              d="M 0 0 L -9 -4.5 L -9 4.5 Z"
              fill={color}
              transform={`translate(${tip.x} ${tip.y}) rotate(${tip.angle})`}
              className="cv-arrow-tip"
            />

            {arrow.label && (
              <g transform={`translate(${mid.x} ${mid.y})`} className="cv-arrow-label">
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-mono"
                  fontSize={11}
                  stroke="var(--panel)"
                  strokeWidth={4}
                  paintOrder="stroke"
                  fill={color}
                >
                  {arrow.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
