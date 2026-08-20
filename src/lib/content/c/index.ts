import type { Lesson } from "@/lib/viz/types";
import { variablesAndMemory } from "./variables-and-memory";
import { dataTypesAndSizes } from "./data-types-and-sizes";
import { controlFlow } from "./control-flow";
import { functionsAndScope } from "./functions-and-scope";
import { pointers101 } from "./pointers-101";
import { pointerArithmetic } from "./pointer-arithmetic";
import { arraysVsPointers } from "./arrays-vs-pointers";
import { functionCallStack } from "./function-call-stack";
import { recursionAndTheStack } from "./recursion-and-the-stack";
import { dynamicMemory } from "./dynamic-memory";
import { structsAndPadding } from "./structs-and-padding";
import { stringsInMemory } from "./strings-in-memory";
import { bitwiseOperations } from "./bitwise-operations";

/**
 * Order here is the order of the track. It is a path, not a menu — each
 * lesson assumes the mental model the previous one built.
 */
export const C_LESSONS: Lesson[] = [
  variablesAndMemory,
  dataTypesAndSizes,
  controlFlow,
  functionsAndScope,
  pointers101,
  pointerArithmetic,
  arraysVsPointers,
  functionCallStack,
  recursionAndTheStack,
  dynamicMemory,
  structsAndPadding,
  stringsInMemory,
  bitwiseOperations,
];
