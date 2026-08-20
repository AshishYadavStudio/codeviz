"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Scene } from "@/lib/viz/types";
import { boxesEqual, type Box } from "@/lib/viz/geometry";
import { CellRegistryContext } from "./cell-registry";
import { RegionView } from "./RegionView";
import { ArrowLayer } from "./ArrowLayer";

const CALLOUT_TONE = {
  info: "border-border bg-surface text-text",
  active: "border-amber/60 bg-amber-wash text-ink",
  success: "border-green/60 bg-green-wash text-ink",
  danger: "border-danger/60 bg-danger-wash text-ink",
} as const;

interface Props {
  scene: Scene;
  /** Accessible description of the current step, announced to screen readers. */
  summary?: string;
  className?: string;
}

/**
 * The one visualization engine.
 *
 * Renders a declarative `Scene` — memory regions as DOM, pointers as a
 * measured SVG overlay on top. Every topic on the site drives this component
 * with data; nothing draws its own boxes.
 */
export function MemoryGrid({ scene, summary, className }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const cellEls = useRef(new Map<string, HTMLElement>());
  const [boxes, setBoxes] = useState<Record<string, Box>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cellEls.current.set(id, el);
    else cellEls.current.delete(id);
  }, []);

  const registry = useMemo(() => ({ register }), [register]);

  const measure = useCallback(() => {
    const root = contentRef.current;
    if (!root) return;

    const origin = root.getBoundingClientRect();
    const next: Record<string, Box> = {};
    cellEls.current.forEach((el, id) => {
      // Skip cells that unmounted between render and measure.
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      next[id] = {
        x: r.left - origin.left,
        y: r.top - origin.top,
        w: r.width,
        h: r.height,
      };
    });

    setBoxes((prev) => (boxesEqual(prev, next) ? prev : next));
    setSize((prev) =>
      prev.w === root.scrollWidth && prev.h === root.scrollHeight
        ? prev
        : { w: root.scrollWidth, h: root.scrollHeight },
    );
  }, []);

  // Runs after every render (cells register during their own layout effects,
  // which fire first). The equality guard stops the state update from looping.
  useLayoutEffect(measure);

  // Re-measure on container resize and on font load, both of which move cells.
  useLayoutEffect(() => {
    const root = contentRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(root);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <div className="cv-graph-paper relative min-w-0 overflow-x-auto rounded-[var(--radius-card)] border border-border bg-panel">
        <div ref={contentRef} className="relative min-w-max p-5 sm:p-6">
          <CellRegistryContext.Provider value={registry}>
            <div className="flex flex-col gap-6">
              {scene.regions.map((region) => (
                <RegionView key={region.id} region={region} />
              ))}
            </div>
          </CellRegistryContext.Provider>

          <ArrowLayer
            arrows={scene.arrows ?? []}
            boxes={boxes}
            width={size.w}
            height={size.h}
          />
        </div>
      </div>

      {scene.callout && (
        <p
          className={[
            "mt-2 rounded-[var(--radius-card)] border px-3 py-2 text-sm leading-relaxed",
            CALLOUT_TONE[scene.callout.tone],
          ].join(" ")}
        >
          {scene.callout.text}
        </p>
      )}

      {/* Screen readers get the step described in words; the canvas is decorative to them. */}
      <p className="sr-only" role="status" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
