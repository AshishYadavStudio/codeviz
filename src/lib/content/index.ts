import type { Lesson, Track, TrackId } from "@/lib/viz/types";
import { C_LESSONS } from "./c";
import { CPP_LESSONS } from "./cpp";
import { CSHARP_LESSONS } from "./csharp";
import { JAVA_LESSONS } from "./java";
import { DSA_LESSONS } from "./dsa";
import { LINUX_LESSONS } from "./linux";
import { DATA_LESSONS } from "./data";

/**
 * Tracks in curriculum order. A track only appears in navigation once it has
 * lessons — `status` is derived below rather than hand-maintained, so adding a
 * lesson file is the only step needed to bring a track online.
 */
const TRACK_META: Omit<Track, "status">[] = [
  {
    id: "c",
    title: "C",
    short: "C",
    blurb: "Pointers, the stack, the heap, and what the bytes actually look like.",
  },
  {
    id: "cpp",
    title: "C++",
    short: "C++",
    blurb: "Objects, RAII, move semantics, containers and vtables — as memory, not rules.",
  },
  {
    id: "java",
    title: "Java",
    short: "Java",
    blurb: "References vs objects, the string pool, collection internals and the garbage collector.",
  },
  {
    id: "csharp",
    title: "C#",
    short: "C#",
    blurb: "Value vs reference types, boxing, LINQ pipelines and async state machines.",
  },
  {
    id: "dsa",
    title: "Data Structures",
    short: "DSA",
    blurb:
      "Arrays, lists, trees, heaps and graphs — watch the pointers move and the search space shrink.",
  },
  {
    id: "linux",
    title: "Linux",
    short: "Linux",
    blurb: "The filesystem, permission bits, processes and pipelines — things you can watch run.",
  },
  {
    id: "data",
    title: "Data Analytics",
    short: "Data",
    blurb: "Dataframes, filtering, missing data, group-by and joins — one transformation at a time.",
  },
];

const BY_TRACK: Record<TrackId, Lesson[]> = {
  c: C_LESSONS,
  cpp: CPP_LESSONS,
  java: JAVA_LESSONS,
  csharp: CSHARP_LESSONS,
  dsa: DSA_LESSONS,
  linux: LINUX_LESSONS,
  data: DATA_LESSONS,
};

export const TRACKS: Track[] = TRACK_META.map((track) => ({
  ...track,
  status: BY_TRACK[track.id].length > 0 ? "live" : "planned",
}));

export const LIVE_TRACKS = TRACKS.filter((track) => track.status === "live");

export const LESSONS: Lesson[] = TRACK_META.flatMap((track) => BY_TRACK[track.id]);

export function lessonsForTrack(track: TrackId): Lesson[] {
  return BY_TRACK[track] ?? [];
}

export function getLesson(track: TrackId, slug: string): Lesson | undefined {
  return lessonsForTrack(track).find((lesson) => lesson.slug === slug);
}

export function getTrack(id: string): Track | undefined {
  return TRACKS.find((track) => track.id === id);
}

export function isTrackId(id: string): id is TrackId {
  return TRACKS.some((track) => track.id === id);
}

/** Neighbours for the "next concept" link at the foot of a lesson. */
export function lessonNeighbours(lesson: Lesson) {
  const siblings = lessonsForTrack(lesson.track);
  const i = siblings.findIndex((l) => l.slug === lesson.slug);
  return {
    prev: i > 0 ? siblings[i - 1] : undefined,
    next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : undefined,
  };
}

export function trackStats(track: TrackId) {
  const lessons = lessonsForTrack(track);
  return {
    lessons: lessons.length,
    minutes: lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    stages: lessons.reduce((sum, lesson) => sum + lesson.stages.length, 0),
  };
}
