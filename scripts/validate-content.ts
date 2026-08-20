/**
 * Content integrity checks.
 *
 * The lessons are hand-authored data driving a generic engine, so the failures
 * that actually happen are data failures: an arrow pointing at a cell id that
 * does not exist in that stage, a duplicated id that makes measurement
 * ambiguous, or a highlighted line past the end of the code sample. None of
 * those are type errors, and all of them render as silently missing visuals.
 *
 * Run with: npm run validate
 */
import { LESSONS, TRACKS } from "../src/lib/content";
import { curriculumFor } from "../src/lib/content/curriculum";
import type { Cell, Scene } from "../src/lib/viz/types";

const problems: string[] = [];

/**
 * Every addressable element in a scene, across all region kinds. Table cells
 * and tree nodes register with the arrow layer exactly like memory cells do, so
 * they must be collected here too — otherwise a valid arrow into a table looks
 * like a dangling reference.
 */
function sceneCells(scene: Scene): Cell[] {
  const cells: Cell[] = [];
  for (const region of scene.regions) {
    for (const frame of region.frames ?? []) cells.push(...frame.cells);
    cells.push(...(region.cells ?? []));
    for (const row of region.table?.rows ?? []) cells.push(...row.cells);
    for (const node of region.tree ?? []) cells.push({ id: node.id, state: node.state });
    for (const node of region.nodes ?? []) cells.push({ id: node.id, state: node.state });
  }
  return cells;
}

for (const lesson of LESSONS) {
  const where = (stageId: string) => `${lesson.slug} / ${stageId}`;

  if (lesson.stages.length === 0) problems.push(`${lesson.slug}: no stages`);

  const stageIds = new Set<string>();
  for (const stage of lesson.stages) {
    if (stageIds.has(stage.id)) problems.push(`${lesson.slug}: duplicate stage id "${stage.id}"`);
    stageIds.add(stage.id);

    const cells = sceneCells(stage.scene);
    const ids = new Set<string>();
    for (const cell of cells) {
      if (ids.has(cell.id)) {
        problems.push(`${where(stage.id)}: duplicate cell id "${cell.id}" — arrows and measurement need unique ids`);
      }
      ids.add(cell.id);
    }

    for (const arrow of stage.scene.arrows ?? []) {
      if (!ids.has(arrow.from)) {
        problems.push(`${where(stage.id)}: arrow "${arrow.id}" starts at missing cell "${arrow.from}"`);
      }
      if (!ids.has(arrow.to)) {
        problems.push(`${where(stage.id)}: arrow "${arrow.id}" ends at missing cell "${arrow.to}"`);
      }
    }

    if (stage.code) {
      const lineCount = stage.code.replace(/\n+$/, "").split("\n").length;
      for (const line of stage.activeLines ?? []) {
        if (line < 1 || line > lineCount) {
          problems.push(`${where(stage.id)}: activeLine ${line} is outside the ${lineCount}-line sample`);
        }
      }
    } else if (stage.activeLines?.length) {
      problems.push(`${where(stage.id)}: activeLines set but the stage has no code`);
    }

    if (stage.body.length === 0) problems.push(`${where(stage.id)}: empty body`);
  }
}

const slugs = new Set<string>();
for (const lesson of LESSONS) {
  if (slugs.has(lesson.slug)) problems.push(`duplicate lesson slug "${lesson.slug}"`);
  slugs.add(lesson.slug);
}

/**
 * Track pages render the curriculum, so a lesson whose slug is missing from it
 * is built but unreachable — the worst kind of failure, because the page still
 * exists and nothing errors.
 */
let mappedTotal = 0;
for (const track of TRACKS) {
  const modules = curriculumFor(track.id);
  const mapped = new Set<string>();

  for (const group of modules) {
    for (const entry of group.entries) {
      if (mapped.has(entry.slug)) {
        problems.push(`${track.id}: duplicate curriculum slug "${entry.slug}"`);
      }
      mapped.add(entry.slug);
    }
  }
  mappedTotal += mapped.size;

  for (const lesson of LESSONS.filter((l) => l.track === track.id)) {
    if (!mapped.has(lesson.slug)) {
      problems.push(
        `${track.id}: lesson "${lesson.slug}" is not in the curriculum — it would be unreachable from /${track.id}`,
      );
    }
  }
}

const stageTotal = LESSONS.reduce((n, l) => n + l.stages.length, 0);

if (problems.length > 0) {
  console.error(`✗ ${problems.length} content problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `✓ ${LESSONS.length} lessons / ${stageTotal} stages built, ${mappedTotal} concepts mapped across ${TRACKS.length} tracks.`,
);
console.log("  All arrows, line references and curriculum slugs resolve.");
