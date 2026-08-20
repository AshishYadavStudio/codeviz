import type { Cell, CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const VALUES = [3, 8, 12, 19, 27, 34, 41, 56];
const TARGET = 41;

const CODE = `int binary_search(int arr[], int n, int target) {
    int lo = 0;
    int hi = n - 1;

    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;

        if (arr[mid] == target)
            return mid;
        else if (arr[mid] < target)
            lo = mid + 1;
        else
            hi = mid - 1;
    }
    return -1;
}`;

/**
 * Every step is the same picture: the array, with the live range highlighted
 * and the discarded half hatched out. The point of the lesson is that the
 * hatched region only ever grows.
 */
function scene(opts: {
  lo: number;
  hi: number;
  mid?: number;
  found?: boolean;
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = VALUES.map((value, i) => {
    let state: CellState = "idle";
    if (i < opts.lo || i > opts.hi) state = "freed"; // eliminated
    else if (opts.mid === i) state = opts.found ? "success" : "active";
    else state = "read"; // still in the live range

    return {
      id: `a${i}`,
      name: `[${i}]`,
      value: String(value),
      state,
      row: 0,
      note: noteFor(i, opts),
    };
  });

  return {
    regions: [
      blocksRegion(
        "array",
        "Sorted array",
        [{ id: "arr", label: "arr", state: "active", badge: `target = ${TARGET}`, cells }],
        `${opts.hi - opts.lo + 1} of ${VALUES.length} elements still possible`,
      ),
    ],
    callout: opts.callout,
  };
}

function noteFor(i: number, opts: { lo: number; hi: number; mid?: number }) {
  const marks: string[] = [];
  if (i === opts.lo) marks.push("lo");
  if (i === opts.mid) marks.push("mid");
  if (i === opts.hi) marks.push("hi");
  return marks.length > 0 ? marks.join(" · ") : undefined;
}

export const binarySearch: Lesson = {
  slug: "binary-search",
  track: "dsa",
  title: "Binary search",
  tagline: "Every comparison throws away half the array. That is the whole algorithm.",
  description:
    "Step through a binary search watching lo, mid and hi move, and see why eight elements take three comparisons rather than eight — plus the two bugs almost everyone writes first.",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "c",
  keywords: ["binary search", "logarithmic search", "sorted array", "off by one", "midpoint overflow"],
  intro: [
    "You're guessing a number between 1 and 100. Every guess, you get told \"higher\" or \"lower\". What's the fewest guesses needed to be sure? Seven — because each guess halves the remaining range.",
    "**Binary search** is exactly that algorithm applied to a sorted array. Look at the middle. Too big? Discard the right half. Too small? Discard the left half. Repeat. A million-element array takes about 20 comparisons.",
    "But binary search is famously easy to get *slightly* wrong. This lesson steps through the algorithm, points at the classic off-by-one and integer-overflow traps, and shows you the version that actually works.",
  ],
  stages: [
    {
      id: "setup",
      title: "The array must already be sorted",
      body: [
        "Binary search needs one guarantee: if `arr[mid]` is smaller than the target, everything to its left is smaller too.",
        "That is the entire reason it works, and the entire reason it fails silently on unsorted input — it will not error, it will just return `-1` for a value that is present.",
      ],
      code: CODE,
      activeLines: [2, 3],
      scene: scene({
        lo: 0,
        hi: 7,
        callout: {
          tone: "info",
          text: "8 elements. A linear scan needs up to 8 comparisons; this will need 3.",
        },
      }),
    },
    {
      id: "first-mid",
      title: "Look at the middle: arr[3] = 19",
      body: [
        "`mid = 0 + (7 - 0) / 2 = 3`. Integer division rounds down, so with an even count the midpoint leans left. That is fine — it just has to be *inside* the range.",
        "19 is less than 41, so the target cannot be at index 3 or anywhere left of it.",
      ],
      code: CODE,
      activeLines: [6, 10],
      scene: scene({
        lo: 0,
        hi: 7,
        mid: 3,
        callout: { tone: "active", text: "arr[3] = 19 < 41 → everything from 0 to 3 is eliminated." },
      }),
    },
    {
      id: "narrow-1",
      title: "lo = mid + 1 discards the left half",
      body: [
        "Four elements are gone after a single comparison. Note the `+ 1`: index 3 was checked and is not the answer, so it must be excluded.",
        "Writing `lo = mid` instead would leave index 3 in the range forever, and the loop would never end.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        lo: 4,
        hi: 7,
        callout: { tone: "active", text: "Live range is now [4, 7] — half the array, gone in one step." },
      }),
    },
    {
      id: "second-mid",
      title: "Middle of what is left: arr[5] = 34",
      body: [
        "`mid = 4 + (7 - 4) / 2 = 5`. The midpoint is always computed from the *current* range, not the original array.",
        "34 is still less than 41, so the left half of the remaining range goes too.",
      ],
      code: CODE,
      activeLines: [6, 10],
      scene: scene({
        lo: 4,
        hi: 7,
        mid: 5,
        callout: { tone: "active", text: "arr[5] = 34 < 41 → indices 4 and 5 are eliminated." },
      }),
    },
    {
      id: "narrow-2",
      title: "Two candidates left",
      body: [
        "The range is `[6, 7]`. Two comparisons have reduced eight possibilities to two.",
        "This is the halving that makes the algorithm logarithmic: each step does a constant amount of work and discards a constant *fraction* of the input.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        lo: 6,
        hi: 7,
        callout: { tone: "active", text: "8 → 4 → 2. One more comparison decides it." },
      }),
    },
    {
      id: "found",
      title: "arr[6] = 41 — found at index 6",
      body: [
        "`mid = 6 + (7 - 6) / 2 = 6`, and `arr[6]` equals the target, so the index is returned.",
        "Three comparisons for eight elements. Double the array to 16 and it costs four; a million elements cost twenty.",
      ],
      code: CODE,
      activeLines: [8, 9],
      scene: scene({
        lo: 6,
        hi: 7,
        mid: 6,
        found: true,
        callout: {
          tone: "success",
          text: "log₂(8) = 3. Each doubling of the input adds exactly one comparison.",
        },
      }),
    },
    {
      id: "not-found",
      title: "When the target is absent, lo passes hi",
      body: [
        "Search for 40 instead and the range keeps shrinking until `lo` becomes greater than `hi` — an empty range. The loop condition `lo <= hi` fails and the function returns `-1`.",
        "The `<=` matters. With `lo < hi` the loop exits while one candidate is still unexamined, and single-element ranges are never checked.",
      ],
      code: CODE,
      activeLines: [5, 15],
      scene: scene({
        lo: 7,
        hi: 6,
        callout: {
          tone: "danger",
          text: "lo = 7, hi = 6 — an empty range. Using `lo < hi` here would skip the last candidate.",
        },
      }),
    },
    {
      id: "overflow",
      title: "Why mid is written that way",
      body: [
        "`(lo + hi) / 2` is the obvious formula and it is wrong. On a large array `lo + hi` can exceed `INT_MAX` and overflow to a negative number, producing an out-of-bounds index.",
        "`lo + (hi - lo) / 2` computes the same midpoint without ever forming the large sum. This bug sat undetected in the JDK's binary search for nine years.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        lo: 0,
        hi: 7,
        mid: 3,
        callout: {
          tone: "success",
          text: "Sorted input · lo <= hi · mid excluded when narrowing · overflow-safe midpoint. Get those four right and it works.",
        },
      }),
    },
  ],
};
