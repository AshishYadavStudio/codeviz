import type { CellState, Frame, Lesson, Scene } from "@/lib/viz/types";
import { bin8, bitRegion } from "@/lib/viz/scene-helpers";

const A = 44; // 0010 1100
const B = 26; // 0001 1010
const READ = 1 << 2; // 0000 0100

const CODE = `#include <stdio.h>

#define READ (1u << 2)      /* 0000 0100 */

int main(void) {
    unsigned char a = 44;   /* 0010 1100 */
    unsigned char b = 26;   /* 0001 1010 */

    printf("%d\\n", a & b);              /* 8   */
    printf("%d\\n", a | b);              /* 62  */
    printf("%d\\n", a ^ b);              /* 54  */
    printf("%d\\n", (unsigned char)~a);  /* 211 */
    printf("%d\\n", a << 1);             /* 88  */
    printf("%d\\n", a >> 2);             /* 11  */

    unsigned char perms = 0;
    perms |= READ;                      /* set   */
    if (perms & READ) puts("readable"); /* test  */
    perms &= ~READ;                     /* clear */

    return 0;
}`;

type LaneMode = "input" | "result" | "mask";

/** One 8-bit row. Set bits in a result row are amber — that is the live answer. */
function lane(id: string, label: string, value: number, mode: LaneMode = "input"): Frame {
  return {
    id,
    label,
    badge: `${String(value).padStart(3, " ")}  ·  ${bin8(value)}`,
    cells: Array.from({ length: 8 }, (_, i) => {
      const position = 7 - i;
      const bit = (value >> position) & 1;
      const state: CellState = !bit
        ? "idle"
        : mode === "result"
          ? "active"
          : mode === "mask"
            ? "success"
            : "read";
      return { id: `${id}-${position}`, value: String(bit), state };
    }),
  };
}

/** Bit positions, so "bit 3" means something on screen. */
const rulerLane: Frame = {
  id: "ruler",
  label: "bit",
  cells: Array.from({ length: 8 }, (_, i) => ({
    id: `ruler-${7 - i}`,
    value: String(7 - i),
    state: "padding" as CellState,
  })),
};

const scene = (lanes: Frame[], callout?: Scene["callout"], caption?: string): Scene => ({
  regions: [
    bitRegion("bits", "One byte", [rulerLane, ...lanes], caption ?? "8 bits · value = sum of the set powers of two"),
  ],
  callout,
});

export const bitwiseOperations: Lesson = {
  slug: "bitwise-operations",
  track: "c",
  title: "Bitwise operations",
  tagline: "Eight switches in a byte. These operators flip them in parallel.",
  description:
    "Watch AND, OR, XOR, NOT and both shifts applied to a real byte, bit by bit — then use them the way they are actually used, to set, test and clear flags.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "c",
  keywords: ["bitwise operators", "bit manipulation", "bitmask", "shift operators", "xor", "flags"],
  stages: [
    {
      id: "intro",
      title: "A byte is eight independent bits",
      body: [
        "`a = 44` is not really \"forty-four\" in memory. It is the pattern `0010 1100` — bits 5, 3 and 2 switched on, and 32 + 8 + 4 = 44.",
        "Bitwise operators ignore the number entirely and work on the switches, one column at a time, all eight in a single instruction.",
      ],
      code: CODE,
      activeLines: [6, 7],
      scene: scene([lane("a", "a", A), lane("b", "b", B)], {
        tone: "info",
        text: "Bit n is worth 2ⁿ. Bit 5 is 32, bit 3 is 8, bit 2 is 4 — that is the whole encoding.",
      }),
    },
    {
      id: "and",
      title: "a & b — on only where both are on",
      body: [
        "Column by column: a bit in the result is 1 only if that bit is 1 in *both* operands. Only bit 3 qualifies, so the answer is 8.",
        "AND is how you *test* and how you *keep*: `x & mask` throws away every bit the mask does not have.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene(
        [lane("a", "a", A), lane("b", "b", B), lane("r", "a & b", A & B, "result")],
        { tone: "active", text: "Only bit 3 is set in both. 0010 1100 & 0001 1010 = 0000 1000 = 8." },
      ),
    },
    {
      id: "or",
      title: "a | b — on where either is on",
      body: [
        "A bit is 1 in the result if it is 1 in either operand. Bits 5, 4, 3, 2 and 1 all survive: 32 + 16 + 8 + 4 + 2 = 62.",
        "OR is how you *add* bits to a value without disturbing the others — the standard way to set a flag.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene(
        [lane("a", "a", A), lane("b", "b", B), lane("r", "a | b", A | B, "result")],
        { tone: "active", text: "0010 1100 | 0001 1010 = 0011 1110 = 62. Nothing was ever turned off." },
      ),
    },
    {
      id: "xor",
      title: "a ^ b — on where they differ",
      body: [
        "XOR gives 1 exactly where the two operands disagree. Bit 3 is set in both, so it cancels to 0; the rest of the set bits differ, giving 54.",
        "XOR is its own inverse: `(a ^ b) ^ b` is `a` again. That property is behind checksums, simple ciphers, and swapping two values without a temporary.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene(
        [lane("a", "a", A), lane("b", "b", B), lane("r", "a ^ b", A ^ B, "result")],
        { tone: "active", text: "Bit 3 was 1 in both, so it cancels. XOR with the same value twice always gets you home." },
      ),
    },
    {
      id: "not",
      title: "~a — every bit flipped",
      body: [
        "NOT inverts all eight bits: `0010 1100` becomes `1101 0011`, which as an `unsigned char` is 211.",
        "The cast matters. `~a` first promotes `a` to `int`, so the raw result is `-45` across 32 bits. Only after narrowing back to one byte do you see 211 — a classic source of surprise.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene(
        [lane("a", "a", A), lane("r", "~a", ~A & 0xff, "result")],
        {
          tone: "danger",
          text: "~ on a small type is a trap: integer promotion widens it first, so mask the result back down.",
        },
      ),
    },
    {
      id: "shift-left",
      title: "a << 1 — every bit moves up one place",
      body: [
        "Each bit slides one position left and a zero enters at the right. `0010 1100` becomes `0101 1000` — 88, exactly double.",
        "Shifting left by n multiplies by 2ⁿ, as long as nothing falls off the top. Here bit 7 was clear so nothing is lost; had `a` been 200, doubling would have overflowed a `unsigned char` and wrapped.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene(
        [lane("a", "a", A), lane("r", "a << 1", (A << 1) & 0xff, "result")],
        { tone: "active", text: "44 × 2 = 88. Bits shifted past the top are gone — there is no carry to catch them." },
      ),
    },
    {
      id: "shift-right",
      title: "a >> 2 — down two places, remainder discarded",
      body: [
        "`0010 1100` becomes `0000 1011`: 11. That is 44 ÷ 4 with the remainder simply dropped off the bottom.",
        "For unsigned values this is exactly integer division by 2ⁿ. For *signed* negative values the behaviour of the vacated top bits is implementation-defined — another reason bit work belongs on unsigned types.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene(
        [lane("a", "a", A), lane("r", "a >> 2", A >> 2, "result")],
        { tone: "active", text: "44 ÷ 4 = 11. The two bits that fell off the right were the remainder." },
      ),
    },
    {
      id: "flags-set",
      title: "What this is actually for: flags",
      body: [
        "`1u << 2` builds a mask with exactly one bit set — `0000 0100`. Give each permission its own bit and one byte carries eight independent yes/no answers.",
        "`perms |= READ` turns that bit on and leaves the other seven exactly as they were. `perms & READ` is non-zero only if the bit is on, which is how you test it.",
      ],
      code: CODE,
      activeLines: [3, 17, 18],
      scene: scene(
        [
          lane("mask", "READ", READ, "mask"),
          lane("before", "perms", 0),
          lane("after", "perms |= READ", READ, "result"),
        ],
        { tone: "active", text: "One bit set, seven untouched. That precision is why |= is the idiom for flags." },
      ),
    },
    {
      id: "flags-clear",
      title: "And clearing is AND-with-NOT",
      body: [
        "`~READ` is `1111 1011` — every bit except the one you care about. AND-ing with it keeps all the other flags and forces this one to 0.",
        "Set with `|=`, clear with `&= ~`, test with `&`, toggle with `^=`. Those four lines cover almost every use of bitwise operators you will meet in real code.",
      ],
      code: CODE,
      activeLines: [19],
      scene: scene(
        [
          lane("mask", "~READ", ~READ & 0xff, "mask"),
          lane("before", "perms", READ),
          lane("after", "perms &= ~READ", 0, "result"),
        ],
        {
          tone: "success",
          text: "|= to set · &= ~ to clear · & to test · ^= to toggle. Four idioms, one byte, eight independent switches.",
        },
      ),
    },
  ],
};
