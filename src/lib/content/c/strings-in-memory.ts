import type { Arrow, Cell, CellState, Lesson, Region, Scene } from "@/lib/viz/types";
import { byteRegion, hex, stackRegion } from "@/lib/viz/scene-helpers";

const BUF_BASE = 0x7ffc0a10;
const RODATA = 0x400a20;
const LIT_ADDR = "0x7ffc0a18";

const CODE = `#include <stdio.h>
#include <string.h>

int main(void) {
    char  buf[6] = "hello";
    char *lit    = "hello";

    printf("%zu\\n", strlen(buf));

    buf[5] = '!';
    printf("%s\\n", buf);

    strcpy(buf, "hello world");
    return 0;
}`;

/** Printable stand-ins — a raw \0 or space would render as nothing. */
const glyph = (ch: string) => (ch === "\0" ? "\\0" : ch === " " ? "␣" : ch);

function bufLane(chars: string[], states: (CellState | undefined)[] = []) {
  return {
    id: "buf",
    label: "buf[6]",
    badge: "6 bytes you own",
    cells: chars.map((ch, i) => ({
      id: `b${i}`,
      value: glyph(ch),
      address: hex(BUF_BASE + i),
      state: states[i] ?? "idle",
    })) satisfies Cell[],
  };
}

function neighbourLane(chars: string[], states: (CellState | undefined)[] = []) {
  return {
    id: "next",
    label: "next",
    badge: "other locals — not yours",
    cells: chars.map((ch, i) => ({
      id: `n${i}`,
      value: glyph(ch),
      address: hex(BUF_BASE + 6 + i),
      state: states[i] ?? "idle",
    })) satisfies Cell[],
  };
}

function scene(opts: {
  buf: string[];
  bufStates?: (CellState | undefined)[];
  neighbours?: string[];
  neighbourStates?: (CellState | undefined)[];
  showLit?: boolean;
  litState?: CellState;
  arrow?: "idle" | "active" | "danger";
  callout?: Scene["callout"];
}): Scene {
  const regions: Region[] = [];
  const arrows: Arrow[] = [];

  if (opts.showLit) {
    regions.push(
      stackRegion([
        {
          id: "main",
          label: "main()",
          state: "active",
          cells: [
            {
              id: "lit",
              name: "lit",
              type: "char *",
              value: hex(RODATA),
              address: LIT_ADDR,
              state: opts.litState ?? "idle",
              row: 0,
            },
          ],
        },
      ]),
    );
  }

  regions.push(
    byteRegion(
      "stackbytes",
      "Stack bytes",
      [
        bufLane(opts.buf, opts.bufStates),
        ...(opts.neighbours
          ? [neighbourLane(opts.neighbours, opts.neighbourStates)]
          : []),
      ],
      "one square = one char",
    ),
  );

  if (opts.showLit) {
    regions.push(
      byteRegion(
        "rodata",
        "Static storage · .rodata",
        [
          {
            id: "lit-lane",
            label: '"hello"',
            badge: "read-only, shared, alive for the whole program",
            cells: ["h", "e", "l", "l", "o", "\0"].map((ch, i) => ({
              id: `r${i}`,
              value: glyph(ch),
              address: hex(RODATA + i),
              state: (i === 0 && opts.arrow ? "read" : "idle") as CellState,
            })),
          },
        ],
      ),
    );

    if (opts.arrow) {
      arrows.push({ id: "lit-arrow", from: "lit", to: "r0", state: opts.arrow, label: "lit" });
    }
  }

  return { regions, arrows, callout: opts.callout };
}

const HELLO = ["h", "e", "l", "l", "o", "\0"];
const NEIGHBOURS = ["\0", "d", "!", "\0", "·", "·"];

export const stringsInMemory: Lesson = {
  slug: "strings-in-memory",
  track: "c",
  title: "Strings in memory",
  tagline: "C has no string type. It has bytes, and an agreement about where they stop.",
  description:
    "See why \"hello\" needs six bytes, how strlen finds the end, the difference between a char array and a pointer to a literal, and what a buffer overflow actually overwrites.",
  difficulty: 3,
  minutes: 11,
  access: "free",
  language: "c",
  keywords: ["c strings", "null terminator", "strlen", "buffer overflow", "string literal", "strcpy"],
  stages: [
    {
      id: "array",
      title: "\"hello\" is five characters and six bytes",
      body: [
        "`char buf[6] = \"hello\";` copies five characters into the array and adds a sixth byte: `'\\0'`, the null terminator.",
        "Nothing in C records that this array is 5 long. The `\\0` *is* the length — every string function finds the end by scanning for it.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        buf: HELLO,
        bufStates: [undefined, undefined, undefined, undefined, undefined, "active"],
        callout: {
          tone: "active",
          text: "Declare buf[5] instead and there is no room for the terminator — the array is no longer a string.",
        },
      }),
    },
    {
      id: "strlen",
      title: "strlen walks until it finds the zero",
      body: [
        "`strlen(buf)` starts at the first byte and reads forward, counting, until it hits `'\\0'`. It returns 5 — the terminator is not counted.",
        "This is an O(n) scan every single time. `strlen` in a loop condition is a classic accidental quadratic.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        buf: HELLO,
        bufStates: ["read", "read", "read", "read", "read", "active"],
        callout: { tone: "active", text: "Five reads, then the stop byte. The length was never stored anywhere." },
      }),
    },
    {
      id: "literal",
      title: "char *lit = \"hello\" is a completely different object",
      body: [
        "This does not copy anything. The characters live in read-only static storage for the entire run of the program, and `lit` is 8 bytes on the stack holding their address.",
        "`buf` is memory you own and may modify. `lit` points at memory you may only read — writing through it is undefined behaviour, and on most systems a segfault.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        buf: HELLO,
        showLit: true,
        litState: "active",
        arrow: "active",
        callout: {
          tone: "danger",
          text: "lit[0] = 'H' compiles cleanly and crashes at runtime. Prefer const char * for literals so the compiler catches it.",
        },
      }),
    },
    {
      id: "compare",
      title: "Same characters, different everything else",
      body: [
        "`sizeof buf` is 6 — the array itself. `sizeof lit` is 8 — a pointer, on a 64-bit machine.",
        "`buf` is modifiable, stack-allocated, and dies with the frame. `lit` refers to shared, read-only bytes that outlive every function. Two identical-looking initialisers, two unrelated things.",
      ],
      code: CODE,
      activeLines: [5, 6],
      scene: scene({
        buf: HELLO,
        showLit: true,
        litState: "read",
        arrow: "idle",
        callout: {
          tone: "info",
          text: "Returning buf from a function is a bug. Returning lit is fine — the literal is still there.",
        },
      }),
    },
    {
      id: "clobber",
      title: "buf[5] = '!' deletes the end of the string",
      body: [
        "This is a perfectly legal write: index 5 is inside a 6-element array. What it overwrites is the terminator.",
        "`buf` is now six characters with no stop byte. `printf(\"%s\")` will keep reading past the array into whatever is next on the stack, printing bytes until it happens to find a zero.",
      ],
      code: CODE,
      activeLines: [10, 11],
      scene: scene({
        buf: ["h", "e", "l", "l", "o", "!"],
        bufStates: [undefined, undefined, undefined, undefined, undefined, "danger"],
        neighbours: NEIGHBOURS,
        neighbourStates: ["read", "read", "read", "read"],
        callout: {
          tone: "danger",
          text: "In bounds and still a bug. The array is fine; the string is broken.",
        },
      }),
    },
    {
      id: "overflow",
      title: "strcpy does not know how big buf is",
      body: [
        "`strcpy(buf, \"hello world\")` copies 12 bytes — 11 characters plus a terminator — into 6 bytes of space. It cannot fail, because it was never told the destination size.",
        "The extra 6 bytes land on whatever the compiler put next: another local, a saved register, or the return address. That last case is how a buffer overflow becomes arbitrary code execution.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene({
        buf: ["h", "e", "l", "l", "o", " "],
        bufStates: ["active", "active", "active", "active", "active", "active"],
        neighbours: ["w", "o", "r", "l", "d", "\0"],
        neighbourStates: ["danger", "danger", "danger", "danger", "danger", "danger"],
        callout: {
          tone: "danger",
          text: "Six bytes written outside the array, silently. No crash, no warning — the corruption surfaces later, somewhere else.",
        },
      }),
    },
    {
      id: "fix",
      title: "Always pass the size, always leave room for the zero",
      body: [
        "Use `snprintf(buf, sizeof buf, \"%s\", src)`, which truncates and always terminates. `strncpy` is not the safe version — it will happily leave the result unterminated.",
        "And remember that `sizeof buf` only works where the array is in scope. Pass it through to any function that needs it, because there the array is just a pointer again.",
        "Next: operating on the bits inside a byte rather than the bytes inside a string.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        buf: HELLO,
        bufStates: ["success", "success", "success", "success", "success", "success"],
        callout: {
          tone: "success",
          text: "n characters need n + 1 bytes. Almost every C string bug is a version of forgetting the + 1.",
        },
      }),
    },
  ],
};
