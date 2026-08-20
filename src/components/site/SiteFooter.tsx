import Link from "next/link";
import { LIVE_TRACKS, TRACKS, trackStats } from "@/lib/content";

export function SiteFooter() {
  const planned = TRACKS.filter((track) => track.status === "planned");

  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-[84rem] flex-col gap-6 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6">
        <div className="max-w-sm">
          <p className="font-display font-semibold text-ink">CodeViz</p>
          <p className="mt-1 leading-relaxed text-muted">
            Every concept is a visualization you step through, not a wall of text you
            scroll past.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-1 sm:grid-cols-3">
          {LIVE_TRACKS.map((track) => {
            const stats = trackStats(track.id);
            return (
              <Link
                key={track.id}
                href={`/${track.id}`}
                className="text-text transition-colors hover:text-steel-ink"
              >
                {track.title}
                <span className="ml-1.5 font-mono text-[0.625rem] text-muted">
                  {stats.lessons}
                </span>
              </Link>
            );
          })}
          {planned.map((track) => (
            <span key={track.id} className="text-muted">
              {track.title} — soon
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-[84rem] px-4 py-4 font-mono text-[0.6875rem] text-muted sm:px-6">
          © {new Date().getFullYear()} CodeViz · built for people who learn by watching
        </p>
      </div>
    </footer>
  );
}
