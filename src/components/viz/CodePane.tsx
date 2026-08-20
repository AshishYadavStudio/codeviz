"use client";

import { useMemo } from "react";
import type { Language } from "@/lib/viz/types";
import { languageLabel, tokenize, TOKEN_CLASS } from "@/lib/code/tokenize";

interface Props {
  code: string;
  /** 1-indexed lines currently executing. Highlighted amber. */
  activeLines?: number[];
  language?: Language;
  filename?: string;
  className?: string;
}

/**
 * Source with a live line marker. The amber bar is the same signal as an
 * active memory cell: "this is what is happening right now".
 */
export function CodePane({
  code,
  activeLines = [],
  language = "c",
  filename = "main.c",
  className,
}: Props) {
  const lines = useMemo(() => code.replace(/\n+$/, "").split("\n"), [code]);
  const active = useMemo(() => new Set(activeLines), [activeLines]);
  const gutterWidth = String(lines.length).length;

  return (
    <div
      className={[
        "overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-border bg-panel px-3 py-1.5">
        <span className="font-mono text-[0.6875rem] text-muted">{filename}</span>
        <span className="cv-eyebrow">{languageLabel(language)}</span>
      </div>

      <pre className="overflow-x-auto py-2 text-[0.8125rem] leading-[1.7]">
        <code className="block">
          {lines.map((line, i) => {
            const lineNo = i + 1;
            const isActive = active.has(lineNo);

            return (
              <span
                key={lineNo}
                data-active={isActive || undefined}
                className={[
                  "flex border-l-2 pr-3 transition-colors duration-300",
                  isActive ? "border-amber bg-amber-wash" : "border-transparent",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className={[
                    "shrink-0 select-none px-3 text-right tabular-nums",
                    isActive ? "text-amber-ink" : "text-muted",
                  ].join(" ")}
                  style={{ width: `calc(${gutterWidth}ch + 1.5rem)` }}
                >
                  {lineNo}
                </span>

                <span className="whitespace-pre">
                  {tokenize(line, language).map((token, k) => (
                    <span key={k} className={TOKEN_CLASS[token.kind]}>
                      {token.text}
                    </span>
                  ))}
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
