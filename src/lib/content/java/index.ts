import type { Lesson } from "@/lib/viz/types";
import { referencesAndObjects } from "./references-and-objects";
import { primitivesAndWrappers } from "./primitives-and-wrappers";
import { stringPool } from "./string-pool";
import { autoboxing } from "./autoboxing";
import { stringBuilder } from "./stringbuilder";
import { classesAndInstances } from "./classes-and-instances";
import { arrayListGrowth } from "./arraylist-growth";
import { hashMapInternals } from "./hashmap-internals";
import { garbageCollection } from "./garbage-collection";

/** Order here is the order of the track. It is a path, not a menu. */
export const JAVA_LESSONS: Lesson[] = [
  referencesAndObjects,
  primitivesAndWrappers,
  autoboxing,
  stringPool,
  stringBuilder,
  classesAndInstances,
  arrayListGrowth,
  hashMapInternals,
  garbageCollection,
];
