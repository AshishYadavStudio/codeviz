import type { Lesson } from "@/lib/viz/types";
import { valueVsReferenceTypes } from "./value-vs-reference-types";
import { boxing } from "./boxing";
import { nullableTypes } from "./nullable-types";
import { propertiesAndFields } from "./properties-and-fields";
import { linqDeferredExecution } from "./linq-deferred-execution";
import { asyncAwait } from "./async-await";

/** Order here is the order of the track. It is a path, not a menu. */
export const CSHARP_LESSONS: Lesson[] = [
  valueVsReferenceTypes,
  boxing,
  nullableTypes,
  propertiesAndFields,
  linqDeferredExecution,
  asyncAwait,
];
