import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Logomark } from "./Logomark";
import { LIVE_TRACKS } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[84rem] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-display text-[0.9375rem] font-semibold tracking-tight text-ink"
        >
          <Logomark />
          CodeViz
        </Link>

        {/* Tracks scroll horizontally on narrow screens rather than wrapping the bar. */}
        <nav
          aria-label="Tracks"
          className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 text-sm"
        >
          {LIVE_TRACKS.map((track) => (
            <Link
              key={track.id}
              href={`/${track.id}`}
              className="shrink-0 rounded px-2 py-1 text-text transition-colors hover:bg-steel-wash hover:text-steel-ink"
            >
              {track.short}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-mono text-[0.6875rem] text-muted lg:inline">
            free · no login
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
