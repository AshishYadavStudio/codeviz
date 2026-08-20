import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `// Bubble sort: swap adjacent pairs, repeat
void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - 1 - i; j++)
            if (arr[j] > arr[j+1])
                swap(&arr[j], &arr[j+1]);
}

// Selection sort: find min, swap to front
void selection_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++)
            if (arr[j] < arr[min_idx]) min_idx = j;
        swap(&arr[i], &arr[min_idx]);
    }
}

// Insertion sort: slide each element into place
void insertion_sort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j+1] = arr[j];
            j--;
        }
        arr[j+1] = key;
    }
}`;

function arrayScene(opts: {
  values: { id: string; value: string; state?: CellState; note?: string }[];
  label: string;
  caption?: string;
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      blocksRegion("arr", opts.label, [{
        id: "data",
        label: "array",
        cells: opts.values.map((v) => ({
          id: v.id,
          value: v.value,
          state: v.state ?? "idle",
          note: v.note,
        })),
      }], opts.caption),
    ],
    callout: opts.callout,
  };
}

export const simpleSorts: Lesson = {
  slug: "simple-sorts",
  track: "dsa",
  title: "Bubble, selection & insertion sort",
  tagline: "O(n²) sorts — and why insertion sort is still used inside fast ones.",
  description:
    "Step through bubble sort swapping adjacent elements, selection sort finding the minimum, and insertion sort sliding elements into place — all O(n²), but insertion sort wins on nearly-sorted data.",
  difficulty: 1,
  minutes: 10,
  access: "free",
  language: "c",
  keywords: ["bubble sort", "selection sort", "insertion sort", "O(n²)", "comparison sort"],
  stages: [
    {
      id: "unsorted",
      title: "Five unsorted values",
      body: [
        "The array is [5, 3, 8, 1, 4]. All three sorts will produce [1, 3, 4, 5, 8], but they move elements in different ways.",
        "All three are O(n²) in the worst case, which means they compare roughly 25 pairs for 5 elements.",
      ],
      code: CODE,
      activeLines: [1],
      scene: arrayScene({
        values: [
          { id: "v0", value: "5" },
          { id: "v1", value: "3" },
          { id: "v2", value: "8" },
          { id: "v3", value: "1" },
          { id: "v4", value: "4" },
        ],
        label: "Unsorted",
        callout: { tone: "info", text: "[5, 3, 8, 1, 4]. Three ways to sort them, same result." },
      }),
    },
    {
      id: "bubble-pass",
      title: "Bubble sort: swap adjacent if out of order",
      body: [
        "Compare 5 and 3 — swap. Compare 5 and 8 — no swap. Compare 8 and 1 — swap. Compare 8 and 4 — swap. After one pass, the largest element (8) has \"bubbled\" to the end.",
        "Each pass puts one element in its final position. After n-1 passes, everything is sorted.",
      ],
      code: CODE,
      activeLines: [3, 4, 5, 6],
      scene: arrayScene({
        values: [
          { id: "b0", value: "3", state: "read", note: "swapped" },
          { id: "b1", value: "5", state: "read", note: "swapped" },
          { id: "b2", value: "1", state: "read", note: "swapped" },
          { id: "b3", value: "4", state: "read", note: "swapped" },
          { id: "b4", value: "8", state: "success", note: "in place" },
        ],
        label: "Bubble sort — after pass 1",
        caption: "4 comparisons, 3 swaps",
        callout: { tone: "active", text: "The largest value bubbles to the end. Repeat for the rest." },
      }),
    },
    {
      id: "selection",
      title: "Selection sort: find the minimum",
      body: [
        "Scan the entire array to find the minimum (1). Swap it with the first element. Now position 0 is correct.",
        "Next, scan from position 1 to find the minimum of the remaining elements (3). Swap with position 1. After n-1 rounds, done.",
      ],
      code: CODE,
      activeLines: [11, 12, 13, 14, 15],
      scene: arrayScene({
        values: [
          { id: "s0", value: "1", state: "success", note: "placed" },
          { id: "s1", value: "3", state: "success", note: "placed" },
          { id: "s2", value: "8", state: "read" },
          { id: "s3", value: "5", state: "read" },
          { id: "s4", value: "4", state: "active", note: "min of rest" },
        ],
        label: "Selection sort — after 2 rounds",
        caption: "finds minimum, swaps to front",
        callout: { tone: "active", text: "Always does n²/2 comparisons. Swaps are few — O(n) total." },
      }),
    },
    {
      id: "insertion",
      title: "Insertion sort: slide into place",
      body: [
        "Take element at index 1 (the 3). Compare with 5 — 3 is smaller, so slide 5 right and insert 3 at position 0. The first two elements are now sorted.",
        "Each element is picked up and slid into the correct position in the already-sorted prefix. Like sorting cards in your hand.",
      ],
      code: CODE,
      activeLines: [21, 22, 23, 24, 25, 26, 27],
      scene: arrayScene({
        values: [
          { id: "i0", value: "1", state: "success" },
          { id: "i1", value: "3", state: "success" },
          { id: "i2", value: "5", state: "success" },
          { id: "i3", value: "4", state: "active", note: "← inserting" },
          { id: "i4", value: "8", note: "not yet processed" },
        ],
        label: "Insertion sort — processing index 3",
        caption: "slide 4 left past 5, stop before 3",
        callout: { tone: "active", text: "4 < 5, so slide 5 right. 4 > 3, so insert here. Sorted prefix grows." },
      }),
    },
    {
      id: "nearly-sorted",
      title: "Insertion sort on nearly-sorted data: O(n)",
      body: [
        "If the array is already almost sorted, each element moves only a few positions. The inner while loop runs only a few times per element — total work approaches O(n).",
        "This is why fast sorts like Timsort and introsort switch to insertion sort for small subarrays. Below ~16 elements, the low overhead of insertion sort beats the divide-and-conquer overhead.",
      ],
      code: CODE,
      activeLines: [24, 25, 26],
      scene: arrayScene({
        values: [
          { id: "n0", value: "1", state: "success" },
          { id: "n1", value: "3", state: "success" },
          { id: "n2", value: "4", state: "success" },
          { id: "n3", value: "5", state: "success" },
          { id: "n4", value: "8", state: "success", note: "already in place" },
        ],
        label: "Nearly sorted → O(n)",
        caption: "inner loop barely runs",
        callout: { tone: "success", text: "Nearly sorted: insertion sort is O(n). That is why fast sorts use it as a base case." },
      }),
    },
    {
      id: "recap",
      title: "Three O(n²) sorts, one winner",
      body: [
        "Bubble sort: simple but always slow — even the best case is O(n²) without an early-exit flag. Selection sort: always n²/2 comparisons, but only O(n) swaps — useful when swaps are expensive.",
        "Insertion sort: O(n) on nearly-sorted data, low overhead, stable. It is the one that survives inside production sorting algorithms.",
      ],
      code: CODE,
      activeLines: [2, 10, 20],
      scene: arrayScene({
        values: [
          { id: "r0", value: "1", state: "success" },
          { id: "r1", value: "3", state: "success" },
          { id: "r2", value: "4", state: "success" },
          { id: "r3", value: "5", state: "success" },
          { id: "r4", value: "8", state: "success" },
        ],
        label: "Sorted: [1, 3, 4, 5, 8]",
        callout: {
          tone: "success",
          text: "All O(n²) worst case. Insertion sort wins on nearly-sorted data — that is why it is used inside Timsort.",
        },
      }),
    },
  ],
};
