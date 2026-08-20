import type { Lesson } from "@/lib/viz/types";
import { filesystemTree } from "./filesystem-tree";
import { filePermissions } from "./file-permissions";
import { inodesAndLinks } from "./inodes-and-links";
import { variablesAndEnvironment } from "./variables-and-environment";
import { pipesAndRedirection } from "./pipes-and-redirection";
import { grepAndRegex } from "./grep-and-regex";
import { processesAndFork } from "./processes-and-fork";

/** Order here is the order of the track. It is a path, not a menu. */
export const LINUX_LESSONS: Lesson[] = [
  filesystemTree,
  filePermissions,
  inodesAndLinks,
  variablesAndEnvironment,
  pipesAndRedirection,
  grepAndRegex,
  processesAndFork,
];
