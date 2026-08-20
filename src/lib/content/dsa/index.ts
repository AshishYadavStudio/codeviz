import type { Lesson } from "@/lib/viz/types";
import { bigO } from "./big-o";
import { arrayMemory } from "./array-memory";
import { linkedList } from "./linked-list";
import { stack } from "./stack";
import { hashTables } from "./hash-tables";
import { binarySearchTrees } from "./binary-search-trees";
import { simpleSorts } from "./simple-sorts";
import { binarySearch } from "./binary-search";

/** Order follows the curriculum, not the order these were authored. */
export const DSA_LESSONS: Lesson[] = [
  bigO,
  arrayMemory,
  linkedList,
  stack,
  hashTables,
  binarySearchTrees,
  simpleSorts,
  binarySearch,
];
