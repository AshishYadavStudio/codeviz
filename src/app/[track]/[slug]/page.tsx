import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConceptPlayer } from "@/components/viz/ConceptPlayer";
import { DifficultyMeter } from "@/components/site/DifficultyMeter";
import {
  getLesson,
  getTrack,
  isTrackId,
  LESSONS,
  lessonNeighbours,
} from "@/lib/content";

interface Props {
  params: Promise<{ track: string; slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ track: lesson.track, slug: lesson.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, slug } = await params;
  if (!isTrackId(track)) return {};
  const lesson = getLesson(track, slug);
  if (!lesson) return {};

  return {
    title: lesson.title,
    description: lesson.description,
    keywords: lesson.keywords,
    alternates: { canonical: `/${track}/${slug}` },
    openGraph: { title: `${lesson.title} · CodeViz`, description: lesson.description },
  };
}

export default async function ConceptPage({ params }: Props) {
  const { track, slug } = await params;
  if (!isTrackId(track)) notFound();

  const lesson = getLesson(track, slug);
  const trackMeta = getTrack(track);
  if (!lesson || !trackMeta) notFound();

  const { prev, next } = lessonNeighbours(lesson);

  return (
    <article className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5">
        <Link href={`/${track}`} className="cv-eyebrow transition-colors hover:text-steel-ink">
          ← {trackMeta.title} track
        </Link>
      </nav>

      <header className="mb-8 max-w-3xl">
        <h1 className="text-[1.75rem] leading-tight sm:text-[2.125rem]">{lesson.title}</h1>
        <p className="mt-2 text-base leading-relaxed sm:text-lg">{lesson.tagline}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.6875rem] text-muted">
          <DifficultyMeter level={lesson.difficulty} />
          <span>{lesson.minutes} min</span>
          <span>{lesson.stages.length} steps</span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <kbd className="rounded border border-border bg-surface px-1 py-px">←</kbd>
            <kbd className="rounded border border-border bg-surface px-1 py-px">→</kbd>
            to step
          </span>
        </div>
      </header>

      <ConceptPlayer lesson={lesson} />

      <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={`/${track}/${prev.slug}`}
            className="rounded-[var(--radius-card)] border border-border p-4 transition-colors hover:border-steel"
          >
            <span className="cv-eyebrow">← Previous concept</span>
            <span className="mt-1 block font-display font-medium text-ink">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            href={`/${track}/${next.slug}`}
            className="rounded-[var(--radius-card)] border border-border p-4 transition-colors hover:border-steel sm:text-right"
          >
            <span className="cv-eyebrow">Next concept →</span>
            <span className="mt-1 block font-display font-medium text-ink">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
