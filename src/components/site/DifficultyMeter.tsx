const LABEL = ["", "intro", "core", "deep"] as const;

/** Three bars, filled in steel. Not a rating — a heads-up. */
export function DifficultyMeter({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-1 rounded-[1px] ${i <= level ? "bg-steel" : "bg-border-strong"}`}
            style={{ height: `${3 + i * 2}px` }}
          />
        ))}
      </span>
      <span>{LABEL[level]}</span>
    </span>
  );
}
