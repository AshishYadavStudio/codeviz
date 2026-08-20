import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { byteRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <stdio.h>
#include <limits.h>

int main(void) {
    char   c = 127;
    short  s = 32000;
    int    i = 2147483647;
    long   l = 100L;
    float  f = 3.14f;
    double d = 3.14159265358979;

    printf("sizeof(char)   = %zu\\n", sizeof(char));    // 1
    printf("sizeof(short)  = %zu\\n", sizeof(short));   // 2
    printf("sizeof(int)    = %zu\\n", sizeof(int));     // 4
    printf("sizeof(long)   = %zu\\n", sizeof(long));    // 8
    printf("sizeof(float)  = %zu\\n", sizeof(float));   // 4
    printf("sizeof(double) = %zu\\n", sizeof(double));  // 8

    c = c + 1;   // 127 + 1 = ?
    return 0;
}`;

function scene(opts: {
  vars: { id: string; name: string; type: string; value: string; bytes: string; state?: CellState }[];
  byteView?: { label: string; cells: { id: string; value: string; state?: CellState }[] };
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      stackRegion(
        [
          {
            id: "main",
            label: "main()",
            state: "active",
            cells: opts.vars.map((v) => ({
              id: v.id,
              name: v.name,
              type: v.type,
              value: v.value,
              state: v.state ?? "idle",
              note: v.bytes,
            })),
          },
        ],
        "each type occupies a fixed number of bytes",
      ),
      ...(opts.byteView
        ? [
            byteRegion("bytes", opts.byteView.label, [
              {
                id: "lane",
                label: "raw bytes",
                cells: opts.byteView.cells.map((c) => ({
                  id: c.id,
                  value: c.value,
                  state: c.state ?? "idle",
                  bytes: 1,
                })),
              },
            ]),
          ]
        : []),
    ],
    callout: opts.callout,
  };
}

export const dataTypesAndSizes: Lesson = {
  slug: "data-types-and-sizes",
  track: "c",
  title: "Data types & sizes",
  tagline: "Why int is 4 bytes, what sizeof really asks, and integer overflow.",
  description:
    "See how char, short, int, long, float and double occupy different amounts of memory, what sizeof reports, and watch signed overflow wrap 127 to -128.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "c",
  keywords: ["sizeof", "data types", "integer overflow", "char", "int", "signed"],
  stages: [
    {
      id: "char",
      title: "char: 1 byte, 256 values",
      body: [
        "A `char` occupies exactly 1 byte — the smallest addressable unit. It can hold values from -128 to 127 (signed) or 0 to 255 (unsigned).",
        "The number 127 fits comfortably. We will come back to see what happens when it does not.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        vars: [{ id: "c", name: "c", type: "char", value: "127", bytes: "1 byte", state: "active" }],
        callout: { tone: "active", text: "1 byte = 8 bits = 2⁸ = 256 possible values." },
      }),
    },
    {
      id: "short",
      title: "short: 2 bytes",
      body: [
        "A `short` uses 2 bytes: 16 bits, range -32 768 to 32 767. Enough for most counts and small measurements.",
        "Notice the sizes double: 1, 2, 4, 8. That is not a coincidence — alignment and bus widths are built around powers of two.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        vars: [
          { id: "c", name: "c", type: "char", value: "127", bytes: "1 byte" },
          { id: "s", name: "s", type: "short", value: "32000", bytes: "2 bytes", state: "active" },
        ],
        callout: { tone: "active", text: "2 bytes = 16 bits = ±32 767. Rarely used on its own today." },
      }),
    },
    {
      id: "int",
      title: "int: 4 bytes — the workhorse",
      body: [
        "`int` is 4 bytes on every modern platform: 32 bits, range roughly ±2.1 billion. It is the default integer type, and the one the CPU is fastest at working with.",
        "The value here is the maximum: 2 147 483 647, or `INT_MAX`. What happens if you add 1 to it? That question drives half of C's reputation for danger.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        vars: [
          { id: "c", name: "c", type: "char", value: "127", bytes: "1 byte" },
          { id: "s", name: "s", type: "short", value: "32000", bytes: "2 bytes" },
          { id: "i", name: "i", type: "int", value: "2147483647", bytes: "4 bytes", state: "active" },
        ],
        callout: { tone: "active", text: "4 bytes = 32 bits = ±2 147 483 647. The type you reach for first." },
      }),
    },
    {
      id: "all-types",
      title: "sizeof reports the size the compiler chose",
      body: [
        "`sizeof` is not a function — it is a compile-time operator. It asks the compiler how many bytes that type or variable occupies, and the answer is baked into the binary.",
        "`float` and `int` are both 4 bytes, but they use those bytes completely differently: `int` is a straightforward binary number, `float` encodes a sign, exponent and mantissa.",
      ],
      code: CODE,
      activeLines: [11, 12, 13, 14, 15, 16],
      scene: scene({
        vars: [
          { id: "c", name: "c", type: "char", value: "127", bytes: "1 byte" },
          { id: "s", name: "s", type: "short", value: "32000", bytes: "2 bytes" },
          { id: "i", name: "i", type: "int", value: "2147483647", bytes: "4 bytes" },
          { id: "l", name: "l", type: "long", value: "100", bytes: "8 bytes" },
          { id: "f", name: "f", type: "float", value: "3.14", bytes: "4 bytes", state: "read" },
          { id: "d", name: "d", type: "double", value: "3.14159…", bytes: "8 bytes", state: "read" },
        ],
        callout: {
          tone: "info",
          text: "sizeof is resolved at compile time. It costs nothing at runtime.",
        },
      }),
    },
    {
      id: "byte-view",
      title: "What 127 looks like in one byte",
      body: [
        "The value 127 in binary is `0111 1111`. Every bit except the sign bit is set to 1 — this is the largest positive number a signed byte can hold.",
        "The sign bit (the leftmost one) is 0, meaning positive. When it flips to 1, the value becomes negative.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        vars: [{ id: "c", name: "c", type: "char", value: "127", bytes: "1 byte", state: "active" }],
        byteView: {
          label: "char c = 127",
          cells: [
            { id: "b7", value: "0", state: "success" },
            { id: "b6", value: "1", state: "read" },
            { id: "b5", value: "1", state: "read" },
            { id: "b4", value: "1", state: "read" },
            { id: "b3", value: "1", state: "read" },
            { id: "b2", value: "1", state: "read" },
            { id: "b1", value: "1", state: "read" },
            { id: "b0", value: "1", state: "read" },
          ],
        },
        callout: { tone: "info", text: "Bit 7 is the sign bit. 0 = positive, 1 = negative." },
      }),
    },
    {
      id: "overflow",
      title: "127 + 1 = -128: signed overflow",
      body: [
        "Adding 1 to `0111 1111` produces `1000 0000`. The sign bit has flipped — the result is -128, not 128.",
        "This is two's complement wraparound. For `unsigned char` the behaviour is defined: 255 + 1 = 0. For signed types, the C standard says the result is **undefined behaviour** — the compiler is free to do anything.",
      ],
      code: CODE,
      activeLines: [18],
      scene: scene({
        vars: [{ id: "c", name: "c", type: "char", value: "-128", bytes: "1 byte", state: "danger" }],
        byteView: {
          label: "char c after overflow",
          cells: [
            { id: "b7o", value: "1", state: "danger" },
            { id: "b6o", value: "0" },
            { id: "b5o", value: "0" },
            { id: "b4o", value: "0" },
            { id: "b3o", value: "0" },
            { id: "b2o", value: "0" },
            { id: "b1o", value: "0" },
            { id: "b0o", value: "0" },
          ],
        },
        callout: {
          tone: "danger",
          text: "Signed overflow is undefined behaviour. On most machines it wraps, but the compiler may optimise as if it never happens.",
        },
      }),
    },
    {
      id: "recap",
      title: "Size decides range, and range decides bugs",
      body: [
        "Every type is a fixed-width window into the number line. `char` sees 256 values, `int` sees 4.3 billion, `double` approximates real numbers with 15 digits of precision.",
        "The overflow problem scales with the type: `int` overflows past ±2.1 billion, `short` past ±32 767. The bug is the same — only the threshold changes.",
      ],
      code: CODE,
      activeLines: [4, 5, 6, 7, 8, 9],
      scene: scene({
        vars: [
          { id: "c2", name: "c", type: "char", value: "127", bytes: "1 byte · max 127" },
          { id: "s2", name: "s", type: "short", value: "32000", bytes: "2 bytes · max 32 767" },
          { id: "i2", name: "i", type: "int", value: "2147483647", bytes: "4 bytes · max ~2.1B" },
          { id: "l2", name: "l", type: "long", value: "100", bytes: "8 bytes · max ~9.2×10¹⁸" },
        ],
        callout: {
          tone: "success",
          text: "Pick the type for the range you need. If the value might exceed it, check before arithmetic — not after.",
        },
      }),
    },
  ],
};
