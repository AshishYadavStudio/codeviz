import type { Lesson } from "@/lib/viz/types";
import { referencesVsPointers } from "./references-vs-pointers";
import { namespaces } from "./namespaces";
import { classLayout } from "./class-layout";
import { raiiAndLifetime } from "./raii-and-lifetime";
import { copyVsMove } from "./copy-vs-move";
import { smartPointers } from "./smart-pointers";
import { vectorGrowth } from "./vector-growth";
import { virtualFunctions } from "./virtual-functions";

/** Order here is the order of the track. It is a path, not a menu. */
export const CPP_LESSONS: Lesson[] = [
  referencesVsPointers,
  namespaces,
  classLayout,
  raiiAndLifetime,
  copyVsMove,
  smartPointers,
  vectorGrowth,
  virtualFunctions,
];
