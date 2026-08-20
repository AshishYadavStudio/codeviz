import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `// Simplified hash table with chaining
#define SIZE 8

int hash(const char *key) {
    int h = 0;
    while (*key) h = h * 31 + *key++;
    return h % SIZE;          // map to bucket 0..7
}

void put(Table *t, const char *key, int val) {
    int bucket = hash(key);
    // insert at head of chain in t->buckets[bucket]
}

int get(Table *t, const char *key) {
    int bucket = hash(key);
    // walk the chain, compare keys
    // average O(1), worst O(n)
}

// Example insertions:
// hash("cat") % 8 = 3
// hash("dog") % 8 = 6
// hash("ant") % 8 = 3  ← collision with "cat"`;

function scene(opts: {
  buckets: { id: string; index: string; entries: { id: string; key: string; value: string; state?: CellState }[]; state?: CellState }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      blocksRegion("table", "Hash table (size 8)", opts.buckets.map((b) => ({
        id: b.id,
        label: `[${b.index}]`,
        state: b.entries.length > 0 ? "active" : ("idle" as const),
        cells: b.entries.length > 0
          ? b.entries.map((e) => ({
              id: e.id,
              name: e.key,
              value: e.value,
              state: e.state ?? "idle",
            }))
          : [{ id: `${b.id}-empty`, value: "—", state: "idle" as CellState }],
      })), "hash(key) % size → bucket index"),
    ],
    callout: opts.callout,
  };
}

const EMPTY_BUCKETS = Array.from({ length: 8 }, (_, i) => ({
  id: `b${i}`,
  index: String(i),
  entries: [] as { id: string; key: string; value: string; state?: CellState }[],
}));

function withEntries(
  entries: { bucket: number; id: string; key: string; value: string; state?: CellState }[],
) {
  const buckets = EMPTY_BUCKETS.map((b) => ({ ...b, entries: [...b.entries] }));
  for (const e of entries) {
    buckets[e.bucket] = {
      ...buckets[e.bucket],
      entries: [...buckets[e.bucket].entries, { id: e.id, key: e.key, value: e.value, state: e.state }],
    };
  }
  return buckets;
}

export const hashTables: Lesson = {
  slug: "hash-tables",
  track: "dsa",
  title: "Hash tables",
  tagline: "A hash becomes a bucket index, and average O(1) lookup follows.",
  description:
    "Watch keys get hashed to bucket indices, see two keys collide into the same bucket and form a chain, and understand why average-case O(1) becomes worst-case O(n).",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "c",
  keywords: ["hash table", "hash function", "collision", "chaining", "O(1) lookup"],
  stages: [
    {
      id: "empty",
      title: "An array of empty buckets",
      body: [
        "A hash table starts as an array of buckets — here, 8 of them. Each bucket can hold a chain of key-value pairs.",
        "The hash function maps any key to an index 0..7. If the function distributes keys evenly, most buckets hold 0 or 1 entries, and lookup is O(1).",
      ],
      code: CODE,
      activeLines: [2],
      scene: scene({
        buckets: EMPTY_BUCKETS,
        callout: { tone: "info", text: "8 buckets, all empty. The hash function decides which bucket a key goes into." },
      }),
    },
    {
      id: "hash",
      title: "hash(\"cat\") → bucket 3",
      body: [
        "The hash function processes each character of \"cat\" and produces a large number. `% SIZE` reduces it to a valid bucket index: 3.",
        "The same key always produces the same hash. Different keys *usually* produce different hashes, but not always — that is the collision problem.",
      ],
      code: CODE,
      activeLines: [4, 5, 6, 7, 19],
      scene: scene({
        buckets: withEntries([
          { bucket: 3, id: "cat", key: "cat", value: "5", state: "active" },
        ]),
        callout: { tone: "active", text: "hash(\"cat\") % 8 = 3. The key goes into bucket 3." },
      }),
    },
    {
      id: "second",
      title: "hash(\"dog\") → bucket 6",
      body: [
        "\"dog\" hashes to bucket 6. Two entries, two different buckets — no collision. Lookup for either key goes directly to its bucket.",
        "With a good hash function and a table that is not too full, this is the common case.",
      ],
      code: CODE,
      activeLines: [20],
      scene: scene({
        buckets: withEntries([
          { bucket: 3, id: "cat2", key: "cat", value: "5" },
          { bucket: 6, id: "dog", key: "dog", value: "8", state: "active" },
        ]),
        callout: { tone: "active", text: "No collision. cat in bucket 3, dog in bucket 6." },
      }),
    },
    {
      id: "collision",
      title: "hash(\"ant\") → bucket 3: collision",
      body: [
        "\"ant\" also hashes to bucket 3. Now there are two entries in the same bucket. This is a collision — inevitable when the number of possible keys exceeds the number of buckets.",
        "With chaining, both entries live in a linked list at bucket 3. Looking up \"ant\" requires scanning that chain.",
      ],
      code: CODE,
      activeLines: [21],
      scene: scene({
        buckets: withEntries([
          { bucket: 3, id: "cat3", key: "cat", value: "5" },
          { bucket: 3, id: "ant", key: "ant", value: "3", state: "active" },
          { bucket: 6, id: "dog2", key: "dog", value: "8" },
        ]),
        callout: { tone: "danger", text: "Collision: cat and ant share bucket 3. Lookup now walks a chain." },
      }),
    },
    {
      id: "lookup",
      title: "get(\"ant\"): hash, then scan the chain",
      body: [
        "To find \"ant\": hash to bucket 3, then compare keys along the chain. First compare with \"cat\" — no match. Then compare with \"ant\" — match, return 3.",
        "Average case: the chain has ~1 entry, so lookup is O(1). Worst case: every key hashes to the same bucket, and the chain is n long — O(n).",
      ],
      code: CODE,
      activeLines: [12, 13, 14, 15],
      scene: scene({
        buckets: withEntries([
          { bucket: 3, id: "cat4", key: "cat", value: "5", state: "read" },
          { bucket: 3, id: "ant2", key: "ant", value: "3", state: "success" },
          { bucket: 6, id: "dog3", key: "dog", value: "8" },
        ]),
        callout: { tone: "success", text: "Hash → bucket 3. Scan chain: cat? no. ant? yes → 3. Two comparisons." },
      }),
    },
    {
      id: "load",
      title: "Load factor and resizing",
      body: [
        "The load factor is entries ÷ buckets. At load factor 1, the average chain length is 1 — O(1). At load factor 10, chains average 10 — O(10), which is O(n/m).",
        "When the load factor exceeds a threshold (typically 0.75), the table doubles its bucket count and rehashes everything. This keeps chains short.",
      ],
      code: CODE,
      activeLines: [4, 5, 6, 7],
      scene: scene({
        buckets: withEntries([
          { bucket: 3, id: "cat5", key: "cat", value: "5" },
          { bucket: 3, id: "ant3", key: "ant", value: "3" },
          { bucket: 6, id: "dog4", key: "dog", value: "8" },
        ]),
        callout: {
          tone: "success",
          text: "Load factor 3/8 = 0.375. Below 0.75 → no resize needed. Average O(1) holds.",
        },
      }),
    },
  ],
};
