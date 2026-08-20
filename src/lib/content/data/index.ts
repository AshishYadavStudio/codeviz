import type { Lesson } from "@/lib/viz/types";
import { dataframesAndFiltering } from "./dataframes-and-filtering";
import { loadingData } from "./loading-data";
import { missingData } from "./missing-data";
import { groupBy } from "./groupby";
import { joins } from "./joins";
import { descriptiveStatistics } from "./descriptive-statistics";
import { sqlSelect } from "./sql-select";

/** Order here is the order of the track. It is a path, not a menu. */
export const DATA_LESSONS: Lesson[] = [
  dataframesAndFiltering,
  loadingData,
  missingData,
  groupBy,
  joins,
  descriptiveStatistics,
  sqlSelect,
];
