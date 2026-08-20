import Link from "next/link";
import { HeroDemo } from "@/components/site/HeroDemo";
import { LIVE_TRACKS, TRACKS, trackStats } from "@/lib/content";
import { curriculumCount } from "@/lib/content/curriculum";

export default function Home() {
  const totals = LIVE_TRACKS.reduce(
    (sum, track) => {
      const stats = trackStats(track.id);
      return {
        lessons: sum.lessons + stats.lessons,
        stages: sum.stages + stats.stages,
        mapped: sum.mapped + curriculumCount(track.id),
      };
    },
    { lessons: 0, stages: 0, mapped: 0 },
  );

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="mx-auto max-w-[84rem] px-4 pt-10 pb-14 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div className="min-w-0">
            <p className="cv-eyebrow mb-4">
              {LIVE_TRACKS.map((t) => t.short).join(" · ")}
            </p>
            <h1 className="text-[2.25rem] leading-[1.08] tracking-tight sm:text-[3rem] lg:text-[3.25rem]">
              Watch your code
              <br />
              think.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed sm:text-lg">
              Most tutorials describe what a pointer is. Here you step through one —
              watching the address change, the arrow move, and the value it lands on
              update, one instruction at a time.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/c"
                className="rounded-[var(--radius-card)] bg-steel px-4 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                Start with C
              </Link>
              <Link
                href="#tracks"
                className="rounded-[var(--radius-card)] border border-border px-4 py-2.5 text-sm transition-colors hover:border-steel hover:text-steel-ink"
              >
                Browse all tracks
              </Link>
            </div>

            <p className="mt-5 font-mono text-[0.6875rem] text-muted">
              {totals.mapped} concepts mapped · {totals.lessons} interactive now ·{" "}
              {totals.stages} steps · free
            </p>
          </div>

          {/* The product, running, above the fold. */}
          <div className="min-w-0">
            <HeroDemo />
            <p className="mt-3 text-center font-mono text-[0.6875rem] text-muted">
              this is a real lesson visualization, not a picture of one
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- how it works */}
      <section id="how" className="scroll-mt-16 border-y border-border bg-surface/60">
        <div className="mx-auto max-w-[84rem] px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-[1.5rem] sm:text-[1.875rem]">One control, everywhere</h2>
          <p className="mt-2 max-w-2xl leading-relaxed">
            Every concept page is a sequence of steps rather than an article. The
            explanation, the code and the diagram all advance together, so you never have
            to hold three things in your head at once.
          </p>

          <ul className="mt-9 grid gap-6 sm:grid-cols-3">
            <HowCard
              index="01"
              title="Step, don't scroll"
              body="Prev, next, and a scrub bar — the same debugger-style control under every visualization on the site."
            />
            <HowCard
              index="02"
              title="Amber means live"
              body="One accent colour, used for one thing: the line executing, the cell being written, the row being kept."
            />
            <HowCard
              index="03"
              title="Real sizes, real behaviour"
              body="Alignment gaps, capacity doubling, hash collisions, permission bits. The diagram matches what actually happens."
            />
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- tracks */}
      <section id="tracks" className="mx-auto max-w-[84rem] scroll-mt-16 px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-[1.5rem] sm:text-[1.875rem]">Tracks</h2>
        <p className="mt-2 max-w-2xl leading-relaxed">
          Each track runs from first principles to intermediate, in the order that makes
          every concept easier than the last.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((track) => {
            const stats = trackStats(track.id);

            if (track.status !== "live") {
              return (
                <div
                  key={track.id}
                  className="rounded-[var(--radius-card)] border border-dashed border-border p-5"
                >
                  <p className="font-display text-lg font-medium text-ink">{track.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{track.blurb}</p>
                  <p className="cv-eyebrow mt-4">in progress</p>
                </div>
              );
            }

            return (
              <Link
                key={track.id}
                href={`/${track.id}`}
                className="group rounded-[var(--radius-card)] border border-border bg-surface p-5 transition-colors hover:border-steel"
              >
                <p className="font-display text-lg font-medium text-ink group-hover:text-steel-ink">
                  {track.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{track.blurb}</p>
                <p className="mt-4 font-mono text-[0.6875rem] text-muted">
                  {stats.lessons} of {curriculumCount(track.id)} live · {stats.stages} steps
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function HowCard({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <li className="border-t-2 border-steel/30 pt-4">
      <span className="cv-eyebrow">{index}</span>
      <h3 className="mt-1 font-display text-base font-medium text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed">{body}</p>
    </li>
  );
}
