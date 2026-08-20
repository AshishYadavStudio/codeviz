# CodeViz

Interactive programming tutorials. Every concept is a visualization you step
through, not an article you scroll past.

Seven live tracks — C, C++, Java, C#, DSA, Linux and Data Analytics — running
from first principles to intermediate.

| Track | Interactive | Mapped | Route |
| --- | --- | --- | --- |
| C | 13 | 30 | `/c` |
| C++ | 8 | 27 | `/cpp` |
| Java | 9 | 31 | `/java` |
| C# | 6 | 20 | `/csharp` |
| Data Structures | 8 | 48 | `/dsa` |
| Linux | 7 | 26 | `/linux` |
| Data Analytics | 7 | 23 | `/data` |

## Curriculum vs lessons

`src/lib/content/curriculum.ts` is the **syllabus**: every concept each track
covers, in teaching order, grouped into modules. `src/lib/content/<track>/` holds
the **lessons**. They are matched by `slug`.

That separation is deliberate. The full path is visible to learners from day
one, and the remaining work is explicit rather than implied — a track page shows
built concepts as playable and the rest as `upcoming`.

**To add a lesson**: author it with the slug already used in the curriculum, and
it becomes playable automatically. Nothing else needs updating. `npm run validate`
fails if a lesson's slug is missing from the curriculum, because such a lesson
would build successfully and still be unreachable from its track page.

```bash
npm run dev       # http://localhost:3000
npm run build     # static export of every concept page
npm run lint
npm run validate  # content integrity — see below
```

## The one architectural decision

There is a single visualization engine. Every topic — pointers today, JVM heaps
later — is **data** fed to it, never a bespoke component.

```
Lesson → Stage[] → Scene → MemoryGrid
```

A `Scene` (`src/lib/viz/types.ts`) declares `Region`s and `Arrow`s between cells.
`MemoryGrid` renders regions as DOM, measures every cell, and draws pointers as
an SVG overlay on top. Adding a topic means writing a data file in
`src/lib/content/<track>/`; it should never mean writing new drawing code.

Region kinds, all driven by the same engine:

| Kind | Used for |
| --- | --- |
| `stack` | call frames, locals |
| `heap` / `blocks` | allocations, objects, processes, pipeline stages |
| `static` | `.rodata`, string pools, vtables |
| `bytes` | struct layout, string characters |
| `bits` | bitwise ops, permission bits |
| `table` | dataframes, hash buckets, query results |
| `tree` | filesystem hierarchies |

Cells in **every** region kind register with the arrow layer, which is what lets
a pointer point into a table row or a tree node, not just a memory cell. If a
topic needs a shape the model cannot express, extend `types.ts` rather than
hand-building a one-off visual.

| File | Role |
| --- | --- |
| `src/lib/viz/types.ts` | The scene model. Start here. |
| `src/components/viz/MemoryGrid.tsx` | The engine: measure cells, place arrows |
| `src/components/viz/StepControls.tsx` | The signature step/scrub control |
| `src/components/viz/ConceptPlayer.tsx` | Split-pane: prose + code + scene, synced |
| `src/lib/viz/geometry.ts` | Arrow routing between measured boxes |
| `src/lib/content/c/*.ts` | The ten lessons, as data |

### Two layout constraints worth knowing

Both exist to keep pointer arrows readable, and both are easy to break by
accident:

1. **Cells are self-contained.** Name, value and address all render *inside* the
   box, because arrows land on box edges — anything printed outside would sit in
   an arrow's path.
2. **Pointers go on their own row.** Set `row: 1` on a pointer cell so its arrow
   travels through the empty lane between rows instead of crossing the cells in
   between.

### Node diagrams place themselves

`nodes` regions (BSTs, heaps, graphs, linked lists) take explicit `level` and
`slot` coordinates rather than running a layout algorithm. That is deliberate:
auto-layout re-balances as nodes are added, so the whole diagram shifts between
steps. The learner is tracking one node moving — everything else must stay
still. Keep a single `POS` table per lesson and reuse it across all stages.

Edges are ordinary `Arrow`s between node ids, so they get the same routing and
draw-in animation as pointers. There is no separate edge renderer.

## Design system

Tokens live in `src/app/globals.css` and drive everything.

**Amber `#E8A33D` is reserved.** It means "live right now" — the executing line,
the active cell, the pointer being followed, the current step. It is never
decoration and never a call to action. If you are reaching for amber, check that
the thing you are colouring is genuinely the live one; a page should have very
few amber elements at a time.

Steel `#2B6CB0` carries structure, graphite `#4A5568` carries body text, green
`#68D391` marks correctness only, and a muted red marks invalid memory. All text
pairs meet WCAG AA in both themes.

Type: Space Grotesk (display), Inter (body), JetBrains Mono (all code and data).

Note that `@theme inline` folds values into utility classes and does **not**
emit them as CSS variables — semantic font and colour variables are therefore
declared in `:root` as well, so base-layer rules can reach them.

## Motion and accessibility

Motion happens only inside visualizations: pointer curves redraw when
retargeted, cells transition state. No decorative page animation.
`prefers-reduced-motion` is respected globally and also gates hero autoplay.
Every step-through is keyboard operable (arrow keys, Home/End), focus is always
visible, and each step is announced to screen readers as prose.

## Content integrity

`npm run validate` checks what TypeScript cannot: that every arrow points at a
cell that exists in that stage, that cell ids are unique per scene (measurement
depends on it), and that highlighted line numbers exist in the code sample.
These failures render as silently missing visuals, so run it after editing
lessons — it has caught a real bug in every content batch so far.

When adding a region kind, remember to teach `sceneCells()` in
`scripts/validate-content.ts` about it, or arrows into that region will be
reported as dangling.

## Built in, not yet switched on

- **Monetization** — `Lesson.access` is `'free' | 'paid'`. Everything is free at
  launch; practice sets can ship without a data migration.
- **Classroom mode** — `?classroom=1` scales the root font size, so the entire
  page including diagrams grows for projection.
- **Progress** — local only, no accounts. It goes through the `ProgressBackend`
  interface in `src/lib/progress.ts` so a server implementation can replace it
  without touching a component.
