import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CurriculumList,
  type CurriculumModuleView,
} from "@/components/site/CurriculumList";
import { curriculumFor } from "@/lib/content/curriculum";
import { getLesson, getTrack, isTrackId, LIVE_TRACKS, trackStats } from "@/lib/content";

interface Props {
  params: Promise<{ track: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return LIVE_TRACKS.map((track) => ({ track: track.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track } = await params;
  const meta = getTrack(track);
  if (!meta) return {};

  return {
    title: `${meta.title} track`,
    description: meta.blurb,
    alternates: { canonical: `/${track}` },
  };
}

export default async function TrackPage({ params }: Props) {
  const { track } = await params;
  if (!isTrackId(track)) notFound();

  const meta = getTrack(track);
  const modules = curriculumFor(track);
  if (!meta || modules.length === 0) notFound();

  const stats = trackStats(track);
  const index = LIVE_TRACKS.findIndex((t) => t.id === track) + 1;

  // A curriculum entry becomes playable the moment a lesson exists for its slug.
  const views: CurriculumModuleView[] = modules.map((module) => ({
    name: module.name,
    summary: module.summary,
    entries: module.entries.map((entry) => {
      const lesson = getLesson(track, entry.slug);
      return {
        slug: entry.slug,
        title: lesson?.title ?? entry.title,
        tagline: lesson?.tagline ?? entry.tagline,
        difficulty: lesson?.difficulty ?? entry.difficulty,
        built: Boolean(lesson),
        minutes: lesson?.minutes,
        steps: lesson?.stages.length,
      };
    }),
  }));

  const total = views.reduce((n, m) => n + m.entries.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10">
        <p className="cv-eyebrow mb-3">
          Track {String(index).padStart(2, "0")} · {meta.title}
        </p>
        <h1 className="text-[2rem] leading-tight sm:text-[2.5rem]">The {meta.title} track</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">{meta.blurb}</p>

        <p className="mt-4 font-mono text-[0.6875rem] text-muted">
          {total} concepts mapped · {stats.lessons} interactive now · {stats.stages} steps · free,
          no login
        </p>
      </header>

      <CurriculumList track={track} modules={views} />

      <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
        The full syllabus is listed above in teaching order. Concepts marked{" "}
        <span className="rounded-sm border border-border px-1.5 py-px font-mono text-[0.5625rem] uppercase tracking-wide">
          upcoming
        </span>{" "}
        are mapped but not yet built as visualizations. Progress is kept in this browser only.
      </p>
    </div>
  );
}
