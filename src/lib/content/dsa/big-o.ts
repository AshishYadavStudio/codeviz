import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `// O(1) — constant: one operation regardless of n
int first = arr[0];

// O(n) — linear: visit every element once
for (int i = 0; i < n; i++)
    sum += arr[i];

// O(n²) — quadratic: nested loop over the same array
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        if (arr[i] > arr[j]) count++;

// O(log n) — halving the work each step
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
}

// O(n log n) — divide into halves, linear merge
merge_sort(arr, 0, n);`;

function scene(opts: {
  blocks: { id: string; label: string; ops: string; state?: CellState; note?: string }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      blocksRegion("complexity", "Operations as n grows", opts.blocks.map((b) => ({
        id: b.id,
        label: b.label,
        cells: [{
          id: `${b.id}-ops`,
          value: b.ops,
          state: b.state ?? "idle",
          note: b.note,
        }],
      })), "count how work scales, ignore constants"),
    ],
    callout: opts.callout,
  };
}

export const bigO: Lesson = {
  slug: "big-o",
  track: "dsa",
  title: "Big-O notation",
  tagline: "Counting how work grows with n, and ignoring everything else.",
  description:
    "Watch the operation count grow for O(1), O(n), O(n²) and O(log n) algorithms as the input size doubles, and see why Big-O drops constants and lower-order terms.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "c",
  keywords: ["Big-O", "time complexity", "O(n)", "O(n²)", "O(log n)", "asymptotic"],
  stages: [
    {
      id: "constant",
      title: "O(1): the same amount of work, always",
      body: [
        "`arr[0]` takes one operation whether the array has 10 elements or 10 million. The input size does not matter.",
        "O(1) means constant time. Hash table lookups, stack push/pop, and array indexing are all O(1).",
      ],
      code: CODE,
      activeLines: [2],
      scene: scene({
        blocks: [
          { id: "n10", label: "n = 10", ops: "1 op", state: "success" },
          { id: "n100", label: "n = 100", ops: "1 op", state: "success" },
          { id: "n1m", label: "n = 1 000 000", ops: "1 op", state: "success" },
        ],
        callout: { tone: "success", text: "O(1) — same cost at any scale. The dream." },
      }),
    },
    {
      id: "linear",
      title: "O(n): proportional to the input",
      body: [
        "A single loop visiting every element once does n operations. Double the input, double the work.",
        "O(n) is the most common complexity. Scanning an array, summing values, and finding the maximum are all O(n).",
      ],
      code: CODE,
      activeLines: [5, 6],
      scene: scene({
        blocks: [
          { id: "n10b", label: "n = 10", ops: "10 ops", state: "active" },
          { id: "n100b", label: "n = 100", ops: "100 ops", state: "active" },
          { id: "n1mb", label: "n = 1 000 000", ops: "1 000 000 ops", state: "active" },
        ],
        callout: { tone: "active", text: "O(n) — double the input, double the time. Linear growth." },
      }),
    },
    {
      id: "quadratic",
      title: "O(n²): nested loops",
      body: [
        "A loop inside a loop, both running to n, does n × n operations. At n = 1 000, that is 1 000 000 operations. At n = 1 000 000, that is 10¹².",
        "Bubble sort, selection sort, and brute-force all-pairs comparisons are O(n²). They work fine for small inputs but collapse on large ones.",
      ],
      code: CODE,
      activeLines: [9, 10, 11],
      scene: scene({
        blocks: [
          { id: "n10c", label: "n = 10", ops: "100 ops", state: "active" },
          { id: "n100c", label: "n = 100", ops: "10 000 ops", state: "read" },
          { id: "n1mc", label: "n = 1 000 000", ops: "10¹² ops", state: "danger", note: "hours" },
        ],
        callout: { tone: "danger", text: "O(n²) — double the input, quadruple the time. Breaks at scale." },
      }),
    },
    {
      id: "logarithmic",
      title: "O(log n): halving the work each step",
      body: [
        "Binary search cuts the problem in half at every step. An array of 1 000 000 elements needs only ~20 comparisons, because log₂(1 000 000) ≈ 20.",
        "O(log n) is the signature of divide-and-conquer on one branch. It grows so slowly that it is essentially constant for practical input sizes.",
      ],
      code: CODE,
      activeLines: [14, 15, 16, 17, 18],
      scene: scene({
        blocks: [
          { id: "n10d", label: "n = 10", ops: "~3 ops", state: "success" },
          { id: "n100d", label: "n = 100", ops: "~7 ops", state: "success" },
          { id: "n1md", label: "n = 1 000 000", ops: "~20 ops", state: "success", note: "barely grows" },
        ],
        callout: { tone: "success", text: "O(log n) — a million elements, 20 steps. Halving is powerful." },
      }),
    },
    {
      id: "nlogn",
      title: "O(n log n): the sorting speed limit",
      body: [
        "Merge sort and quicksort do O(n) work per level of recursion, and there are O(log n) levels. Total: O(n log n).",
        "No comparison-based sort can beat O(n log n). It is the provable lower bound for sorting by comparing elements.",
      ],
      code: CODE,
      activeLines: [21],
      scene: scene({
        blocks: [
          { id: "n10e", label: "n = 10", ops: "~33 ops" },
          { id: "n100e", label: "n = 100", ops: "~664 ops" },
          { id: "n1me", label: "n = 1 000 000", ops: "~20 000 000", state: "active", note: "fast enough" },
        ],
        callout: { tone: "active", text: "O(n log n) — between linear and quadratic. The sweet spot for sorting." },
      }),
    },
    {
      id: "constants",
      title: "Why we drop constants",
      body: [
        "An algorithm doing `3n + 5` operations is O(n), not O(3n+5). Big-O describes the growth rate, not the exact count. Constants depend on hardware, language and implementation — they are real, but they do not change the shape of the curve.",
        "When n is small, constants dominate. When n is large, the exponent dominates. Big-O tells you what happens at scale.",
      ],
      code: CODE,
      activeLines: [5, 6],
      scene: scene({
        blocks: [
          { id: "f1", label: "3n + 5", ops: "O(n)", state: "success", note: "linear" },
          { id: "f2", label: "n² + 1000n", ops: "O(n²)", state: "danger", note: "quadratic wins eventually" },
          { id: "f3", label: "5 log n + 10", ops: "O(log n)", state: "success", note: "logarithmic" },
        ],
        callout: {
          tone: "success",
          text: "Drop constants and lower terms. O(n) means linear growth, regardless of the multiplier.",
        },
      }),
    },
  ],
};
