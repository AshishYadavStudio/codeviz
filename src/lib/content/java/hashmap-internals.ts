import type { Lesson, Region, Scene, TableRow } from "@/lib/viz/types";

const CODE = `import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        HashMap<Integer, String> byId = new HashMap<>();

        byId.put(1, "Ana");     // Integer.hashCode() == the value
        byId.put(2, "Ben");
        byId.put(5, "Cal");     // 5 & 3 == 1 — collides with key 1

        byId.get(5);            // find the bucket, then walk the chain

        byId.put(1, "Ada");     // same key: replace, do not append
    }
}`;

interface Entry {
  key: number;
  value: string;
  state?: "idle" | "active" | "read" | "success" | "danger";
}

/**
 * Integer keys keep the arithmetic honest: Integer.hashCode() returns the value
 * itself, so every bucket index below can be checked by hand.
 */
function bucketRegion(buckets: Entry[][], opts: { activeBucket?: number; footer?: string }): Region {
  const rows: TableRow[] = buckets.map((chain, i) => ({
    id: `bucket-${i}`,
    label: `[${i}]`,
    state: opts.activeBucket === i ? "active" : "idle",
    cells: [
      {
        id: `b${i}-c0`,
        value: chain[0] ? `${chain[0].key} → "${chain[0].value}"` : "null",
        state: chain[0]?.state ?? (chain[0] ? "idle" : "padding"),
      },
      {
        id: `b${i}-c1`,
        value: chain[1] ? `${chain[1].key} → "${chain[1].value}"` : "",
        state: chain[1]?.state ?? "padding",
      },
    ],
  }));

  return {
    id: "table",
    kind: "table",
    label: "HashMap internal table",
    caption: "capacity 4 · one row per bucket",
    table: {
      columns: [
        { id: "first", label: "first entry" },
        { id: "next", label: "next in chain", note: "same bucket, different key" },
      ],
      rows,
      footer: opts.footer,
    },
  };
}

function hashRegion(keys: { key: number; state?: Entry["state"] }[]): Region {
  return {
    id: "hashes",
    kind: "table",
    label: "key → bucket",
    caption: "index = hash & (capacity − 1)",
    table: {
      columns: [
        { id: "key", label: "key" },
        { id: "hash", label: "hashCode()" },
        { id: "idx", label: "& 3" },
      ],
      rows: keys.map((k) => ({
        id: `h-${k.key}`,
        state: k.state === "active" ? "active" : "idle",
        cells: [
          { id: `hk-${k.key}`, value: String(k.key), state: k.state },
          { id: `hh-${k.key}`, value: String(k.key) },
          { id: `hi-${k.key}`, value: String(k.key & 3), state: k.state },
        ],
      })),
    },
  };
}

const ANA: Entry = { key: 1, value: "Ana" };
const BEN: Entry = { key: 2, value: "Ben" };
const CAL: Entry = { key: 5, value: "Cal" };

const scene = (regions: Region[], callout?: Scene["callout"]): Scene => ({ regions, callout });

export const hashMapInternals: Lesson = {
  slug: "hashmap-internals",
  track: "java",
  title: "Inside HashMap",
  tagline: "An array of buckets, an index derived from the hash, and a chain when two keys land together.",
  description:
    "Watch keys hash into buckets, see a collision form a chain, follow a get() through both steps, and learn why a broken hashCode turns O(1) into a silent lookup failure.",
  difficulty: 2,
  minutes: 11,
  access: "free",
  language: "java",
  keywords: ["HashMap", "hashCode", "collision", "bucket", "load factor", "equals contract"],
  intro: [
    "A `HashMap` gives you \"look up a value by any key\" in constant time. How? The map converts the key into a number (the **hash**), uses that number to pick one of several **buckets**, and stores the entry there.",
    "The magic is that going *back* to find the value works the same way: hash the key, pick the bucket, and there it is. No scanning through every entry.",
    "This lesson opens up the buckets, shows a collision when two keys land in the same one, and explains why `equals()` and `hashCode()` must always agree or your map silently loses entries.",
  ],
  stages: [
    {
      id: "empty",
      title: "A HashMap is an array",
      body: [
        "Underneath, a `HashMap` is an array of buckets — 16 by default, shown here as 4 to keep the picture readable. Every slot starts empty.",
        "The array is never searched from one end. The entire design exists to compute *which* slot to look in.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene([bucketRegion([[], [], [], []], { footer: "0 entries" })], {
        tone: "info",
        text: "Constant-time lookup means one index calculation, not a scan.",
      }),
    },
    {
      id: "put-first",
      title: "put(1, \"Ana\") — hash, then index",
      body: [
        "Two steps. First the key's `hashCode()`: for `Integer` that is simply the value, 1. Then the map reduces it to a slot — with a power-of-two capacity that is `hash & (capacity − 1)`, so `1 & 3` = 1.",
        "The entry stores both the key and the value. Keeping the key matters: the map will need it to confirm a match later.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene(
        [
          hashRegion([{ key: 1, state: "active" }]),
          bucketRegion([[], [{ ...ANA, state: "active" }], [], []], {
            activeBucket: 1,
            footer: "1 entry",
          }),
        ],
        { tone: "active", text: "1 & 3 = 1. The hash picks the slot; nothing has been compared yet." },
      ),
    },
    {
      id: "put-second",
      title: "put(2, \"Ben\") lands elsewhere",
      body: [
        "`2 & 3` is 2, a different bucket, so this entry does not interact with the first one at all.",
        "When keys spread evenly across buckets, every chain stays length 1 and lookups really are constant time.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene(
        [
          hashRegion([{ key: 1 }, { key: 2, state: "active" }]),
          bucketRegion([[], [ANA], [{ ...BEN, state: "active" }], []], {
            activeBucket: 2,
            footer: "2 entries",
          }),
        ],
        { tone: "active", text: "Different hash, different bucket. This is the case the structure is designed for." },
      ),
    },
    {
      id: "collision",
      title: "put(5, \"Cal\") collides",
      body: [
        "`5 & 3` is also 1 — the bucket key 1 already occupies. That is a collision, and it is completely normal: 4 buckets cannot possibly give every distinct hash its own slot.",
        "The map keeps both by chaining them, so bucket 1 now holds a short linked list. Nothing is overwritten, because the keys differ.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene(
        [
          hashRegion([{ key: 1 }, { key: 2 }, { key: 5, state: "active" }]),
          bucketRegion([[], [ANA, { ...CAL, state: "active" }], [BEN], []], {
            activeBucket: 1,
            footer: "3 entries · longest chain 2",
          }),
        ],
        {
          tone: "info",
          text: "1 and 5 differ, but their low two bits do not. Collisions are a property of the masking, not a mistake.",
        },
      ),
    },
    {
      id: "get",
      title: "get(5) — index, then compare",
      body: [
        "The lookup repeats step one: hash 5, mask to bucket 1. Then it walks that bucket's chain, calling `equals` on each key until one matches.",
        "This is why both methods matter. `hashCode` chooses the bucket; `equals` establishes identity once you are there.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene(
        [
          hashRegion([{ key: 5, state: "active" }]),
          bucketRegion([[], [{ ...ANA, state: "read" }, { ...CAL, state: "success" }], [BEN], []], {
            activeBucket: 1,
            footer: "compared key 1 (no), then key 5 (yes)",
          }),
        ],
        { tone: "success", text: "One index calculation plus a two-element walk. Short chains are what keep this fast." },
      ),
    },
    {
      id: "replace",
      title: "put(1, \"Ada\") replaces in place",
      body: [
        "Same bucket, and this time `equals` matches an entry that is already there. The map overwrites that entry's value instead of adding a second one.",
        "That is precisely why a map holds unique keys: insertion always compares before it appends.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene(
        [
          bucketRegion([[], [{ key: 1, value: "Ada", state: "active" }, CAL], [BEN], []], {
            activeBucket: 1,
            footer: "still 3 entries — the value was replaced",
          }),
        ],
        { tone: "active", text: "The chain did not grow, because the key was already present." },
      ),
    },
    {
      id: "contract",
      title: "Break hashCode and you break the map",
      body: [
        "If two objects are `equals` but return different hash codes, they are sent to different buckets. The map will store both, and then fail to find either reliably.",
        "The contract runs one way: equal objects **must** produce equal hash codes. Unequal objects are allowed to share one — that is just a collision.",
        "A mutable key is the same bug in slow motion. Change a field that `hashCode` uses after inserting, and the entry is stranded in a bucket nobody will ever look in again.",
      ],
      code: CODE,
      activeLines: [7, 11],
      scene: scene(
        [
          bucketRegion(
            [
              [{ key: 9, value: "same key, hash A", state: "danger" }],
              [ANA, CAL],
              [BEN],
              [{ key: 9, value: "same key, hash B", state: "danger" }],
            ],
            { footer: "two equal keys in two buckets — get() finds whichever the hash points at today" },
          ),
        ],
        {
          tone: "danger",
          text: "Override hashCode and equals together, over fields that never change after insertion.",
        },
      ),
    },
    {
      id: "resize",
      title: "Load factor, resizing, and treeing",
      body: [
        "Once the entry count passes capacity × 0.75, the map allocates a table twice as large and redistributes everything — the bucket index depends on capacity, so it must be recomputed.",
        "That is what keeps chains short as the map grows, preserving O(1) behaviour. Since Java 8 a bucket whose chain grows past a threshold converts into a balanced tree, so the pathological case degrades to O(log n) instead of O(n).",
        "In real `HashMap` the hash is first spread with `h ^ (h >>> 16)` so that high bits influence the low ones. For the small integers here that changes nothing, which is why the arithmetic above is exact.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene(
        [
          bucketRegion([[ANA], [CAL], [BEN], []], {
            footer: "after resize to 8 buckets: same entries, recomputed indices, chains back to length 1",
          }),
        ],
        {
          tone: "success",
          text: "Sizing the map up front — new HashMap<>(expected) — avoids rehashing everything as it fills.",
        },
      ),
    },
  ],
};
