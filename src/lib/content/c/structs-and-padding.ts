import type { Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { byteRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <stdio.h>

struct Point {
    char  tag;
    int   x;
    short y;
};

struct Packed {
    int   x;
    short y;
    char  tag;
};

int main(void) {
    printf("%zu\\n", sizeof(struct Point));   /* 12 */
    printf("%zu\\n", sizeof(struct Packed));  /* 8  */
    return 0;
}`;

type Field = {
  id: string;
  name?: string;
  value?: string;
  bytes: number;
  offset: number;
  state?: Cell["state"];
  note?: string;
};

const lane = (id: string, label: string, fields: Field[], badge?: string): Frame => ({
  id,
  label,
  badge,
  cells: fields.map((f) => ({
    id: f.id,
    name: f.name,
    value: f.value,
    bytes: f.bytes,
    address: `+${f.offset}`,
    state: f.state ?? "idle",
    note: f.note,
  })),
});

const scene = (lanes: Frame[], callout?: Scene["callout"], caption?: string): Scene => ({
  regions: [byteRegion("layout", "Bytes in memory", lanes, caption ?? "one square = one byte")],
  callout,
});

export const structsAndPadding: Lesson = {
  slug: "structs-and-padding",
  track: "c",
  title: "Structs & memory layout",
  tagline: "Your struct is bigger than the sum of its fields, and the field order decides by how much.",
  description:
    "Lay a struct out byte by byte and watch the compiler insert alignment padding — then reorder the fields and watch 12 bytes become 8.",
  difficulty: 3,
  minutes: 10,
  access: "free",
  language: "c",
  keywords: ["struct padding", "memory alignment", "sizeof struct", "data structure alignment", "field ordering"],
  stages: [
    {
      id: "expectation",
      title: "The size you would expect: 7",
      body: [
        "`struct Point` holds a `char` (1 byte), an `int` (4) and a `short` (2). Add them up and you get 7.",
        "`sizeof(struct Point)` is 12. The extra 5 bytes are not a mistake, and they are not overhead the struct needs for bookkeeping — a C struct has no header.",
      ],
      code: CODE,
      activeLines: [3, 4, 5, 6, 7],
      scene: scene(
        [
          lane(
            "wish",
            "expected",
            [
              { id: "w-tag", name: "tag", value: "'A'", bytes: 1, offset: 0 },
              { id: "w-x", name: "x", value: "42", bytes: 4, offset: 1 },
              { id: "w-y", name: "y", value: "7", bytes: 2, offset: 5 },
            ],
            "7 bytes",
          ),
        ],
        { tone: "info", text: "Packed end to end — plausible, and not what any mainstream compiler produces." },
      ),
    },
    {
      id: "tag",
      title: "tag goes at offset 0",
      body: [
        "The first field always starts at the beginning of the struct. A `char` has an alignment requirement of 1, so any address will do.",
        "One byte used, and the next free byte is offset 1.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene(
        [
          lane("real", "struct Point", [
            { id: "tag", name: "tag", value: "'A'", bytes: 1, offset: 0, state: "active" },
          ]),
        ],
        { tone: "active", text: "offset 0, size 1. So far it matches the naive layout." },
      ),
    },
    {
      id: "padding",
      title: "x cannot start at offset 1",
      body: [
        "A 4-byte `int` must sit at an address divisible by 4. Offset 1 is not, so the compiler skips forward to offset 4 and leaves three bytes untouched.",
        "That gap is padding. It is real memory inside your struct that no field owns, is never initialised, and must never be read.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene(
        [
          lane("real", "struct Point", [
            { id: "tag", name: "tag", value: "'A'", bytes: 1, offset: 0 },
            { id: "pad1", bytes: 3, offset: 1, state: "padding", note: "3 bytes of padding" },
            { id: "x", name: "x", value: "42", bytes: 4, offset: 4, state: "active" },
          ]),
        ],
        {
          tone: "active",
          text: "Alignment is a hardware bargain: the CPU reads aligned values in one go, so the compiler spends bytes to buy speed.",
        },
      ),
    },
    {
      id: "y",
      title: "y fits straight after",
      body: [
        "A `short` needs 2-byte alignment. The next free offset is 8, which is divisible by 2, so no padding is needed here.",
        "Ten bytes are now accounted for. But `sizeof` is 12, not 10.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene(
        [
          lane("real", "struct Point", [
            { id: "tag", name: "tag", value: "'A'", bytes: 1, offset: 0 },
            { id: "pad1", bytes: 3, offset: 1, state: "padding" },
            { id: "x", name: "x", value: "42", bytes: 4, offset: 4 },
            { id: "y", name: "y", value: "7", bytes: 2, offset: 8, state: "active" },
          ]),
        ],
        { tone: "active", text: "offset 8 is already 2-aligned, so y slots in with no gap." },
      ),
    },
    {
      id: "tail",
      title: "Two more bytes on the end",
      body: [
        "A struct's own alignment is the largest alignment among its fields — 4 here, because of the `int`. Its total size must be a multiple of that, so the compiler pads the tail from 10 up to 12.",
        "The reason is arrays. In `struct Point pts[2]`, the second element starts at offset `sizeof(struct Point)`. Without tail padding that would be 10, and `pts[1].x` would land on a misaligned address.",
      ],
      code: CODE,
      activeLines: [17],
      scene: scene(
        [
          lane(
            "real",
            "struct Point",
            [
              { id: "tag", name: "tag", value: "'A'", bytes: 1, offset: 0 },
              { id: "pad1", bytes: 3, offset: 1, state: "padding" },
              { id: "x", name: "x", value: "42", bytes: 4, offset: 4 },
              { id: "y", name: "y", value: "7", bytes: 2, offset: 8 },
              { id: "pad2", bytes: 2, offset: 10, state: "padding", note: "tail padding" },
            ],
            "sizeof = 12",
          ),
        ],
        {
          tone: "info",
          text: "5 of 12 bytes — over 40% — exist only to keep the int aligned. In an array of a million, that is 5 MB of nothing.",
        },
      ),
    },
    {
      id: "reorder",
      title: "Same fields, largest first: 8 bytes",
      body: [
        "`struct Packed` declares exactly the same three fields in a different order: `int`, then `short`, then `char`.",
        "`x` takes offsets 0–3, `y` fits at 4–5, `tag` at 6, and only one byte of tail padding is needed to round 7 up to 8. No internal gaps at all.",
      ],
      code: CODE,
      activeLines: [9, 10, 11, 12, 13],
      scene: scene(
        [
          lane(
            "real",
            "struct Point",
            [
              { id: "tag", name: "tag", value: "'A'", bytes: 1, offset: 0 },
              { id: "pad1", bytes: 3, offset: 1, state: "padding" },
              { id: "x", name: "x", value: "42", bytes: 4, offset: 4 },
              { id: "y", name: "y", value: "7", bytes: 2, offset: 8 },
              { id: "pad2", bytes: 2, offset: 10, state: "padding" },
            ],
            "12 bytes",
          ),
          lane(
            "packed",
            "struct Packed",
            [
              { id: "px", name: "x", value: "42", bytes: 4, offset: 0, state: "success" },
              { id: "py", name: "y", value: "7", bytes: 2, offset: 4, state: "success" },
              { id: "ptag", name: "tag", value: "'A'", bytes: 1, offset: 6, state: "success" },
              { id: "ppad", bytes: 1, offset: 7, state: "padding" },
            ],
            "8 bytes",
          ),
        ],
        {
          tone: "success",
          text: "A third smaller, same data, one line of difference. Declare fields largest-first and padding mostly disappears.",
        },
        "the same three fields, twice",
      ),
    },
    {
      id: "rules",
      title: "The two rules that produce every layout",
      body: [
        "First: each field starts at the next offset that is a multiple of its own alignment. Second: the struct's size is rounded up to a multiple of its largest field alignment.",
        "Never assume a layout — use `offsetof` and `sizeof` if you need the real numbers, and never write a struct straight to a file or socket without thinking about the gaps, because padding bytes hold whatever happened to be there.",
        "Next: strings, where the layout question is about where the data *ends*.",
      ],
      code: CODE,
      activeLines: [17, 18],
      scene: scene(
        [
          lane(
            "packed",
            "struct Packed",
            [
              { id: "px", name: "x", value: "42", bytes: 4, offset: 0 },
              { id: "py", name: "y", value: "7", bytes: 2, offset: 4 },
              { id: "ptag", name: "tag", value: "'A'", bytes: 1, offset: 6 },
              { id: "ppad", bytes: 1, offset: 7, state: "padding" },
            ],
            "8 bytes",
          ),
        ],
        {
          tone: "info",
          text: "Padding bytes are uninitialised, so two structs with identical field values can still differ under memcmp.",
        },
      ),
    },
  ],
};
