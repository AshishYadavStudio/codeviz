import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const BUF_A = "0x600100";
const BUF_B = "0x600300";

const CODE = `#include <string>
#include <utility>
#include <vector>

int main() {
    std::string a = "a long string that will not fit inline";

    std::string b = a;              // copy: new buffer, bytes duplicated
    std::string c = std::move(a);   // move: buffer handed over

    // a is now valid but unspecified — do not read it, only reassign it
    a = "safe again";

    std::vector<std::string> v;
    v.push_back(std::move(c));      // move into the container
    return 0;
}`;

interface Owner {
  id: string;
  name: string;
  points: "A" | "B" | null;
  state?: Cell["state"];
  note?: string;
}

function scene(opts: {
  owners: Owner[];
  bufferA?: { state: "live" | "freed"; label?: string };
  bufferB?: boolean;
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = opts.owners.map((owner, i) => ({
    id: owner.id,
    name: owner.name,
    type: "std::string",
    value: owner.points === null ? "nullptr" : owner.points === "A" ? BUF_A : BUF_B,
    state: owner.state ?? "idle",
    note: owner.note,
    row: i === 0 ? 0 : 1,
  }));

  const frames: Frame[] = [];
  const arrows: Arrow[] = [];

  if (opts.bufferA) {
    frames.push({
      id: "bufA",
      label: `heap buffer · ${BUF_A}`,
      state: opts.bufferA.state === "freed" ? "popped" : "active",
      badge: opts.bufferA.label ?? "38 chars",
      cells: [
        {
          id: "bufA-0",
          value: '"a long string…"',
          state: opts.bufferA.state === "freed" ? "freed" : "idle",
          row: 0,
        },
      ],
    });
  }

  if (opts.bufferB) {
    frames.push({
      id: "bufB",
      label: `heap buffer · ${BUF_B}`,
      state: "active",
      badge: "38 chars — a second copy",
      cells: [{ id: "bufB-0", value: '"a long string…"', state: "allocated", row: 0 }],
    });
  }

  for (const owner of opts.owners) {
    if (owner.points === null) continue;
    arrows.push({
      id: `${owner.id}-arrow`,
      from: owner.id,
      to: owner.points === "A" ? "bufA-0" : "bufB-0",
      state: owner.state === "active" ? "active" : "idle",
    });
  }

  return {
    regions: [
      stackRegion([{ id: "main", label: "main()", state: "active", cells }]),
      heapRegion(frames, "the characters — the expensive part"),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const copyVsMove: Lesson = {
  slug: "copy-vs-move",
  track: "cpp",
  title: "Copy vs move semantics",
  tagline: "A copy duplicates the data. A move just changes who owns it.",
  description:
    "Watch a string copy allocate a second buffer and duplicate every byte, then watch a move hand the same buffer over for the price of a pointer assignment.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "cpp",
  keywords: ["move semantics", "std::move", "copy constructor", "rvalue reference", "c++11"],
  stages: [
    {
      id: "start",
      title: "One string, one heap buffer",
      body: [
        "`a` is a small object on the stack — a pointer, a length and a capacity. The characters themselves are too long to store inline, so they live in a heap buffer.",
        "This split is what makes copy and move behave so differently. The stack part is cheap; the heap part is not.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        owners: [{ id: "a", name: "a", points: "A", state: "active" }],
        bufferA: { state: "live" },
        callout: { tone: "info", text: "Copying the 24-byte stack object is trivial. Copying the 38 characters is the real cost." },
      }),
    },
    {
      id: "copy",
      title: "std::string b = a — a full duplicate",
      body: [
        "The copy constructor allocates a **second** buffer and copies every character into it. Now two independent strings exist, each owning its own memory.",
        "Changing `b` cannot affect `a`, which is exactly what you want from a copy — and exactly why it costs an allocation plus a byte-for-byte duplication.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        owners: [
          { id: "a", name: "a", points: "A" },
          { id: "b", name: "b", points: "B", state: "active" },
        ],
        bufferA: { state: "live" },
        bufferB: true,
        callout: { tone: "active", text: "Two owners, two buffers, identical contents. O(n) work and one heap allocation." },
      }),
    },
    {
      id: "move",
      title: "std::move(a) — the buffer changes hands",
      body: [
        "No allocation. No character is touched. The move constructor copies `a`'s pointer into `c`, then sets `a`'s pointer to null so the two do not both try to free it.",
        "`std::move` does not move anything itself. It is a cast that says \"I am done with this value, you may take its guts\" — the move constructor does the work.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        owners: [
          { id: "a", name: "a", points: null, state: "garbage", note: "valid but unspecified" },
          { id: "c", name: "c", points: "A", state: "active" },
        ],
        bufferA: { state: "live", label: "same 38 chars — never copied" },
        callout: {
          tone: "active",
          text: "Constant time, whatever the string's length. This is why move semantics changed C++ performance so much.",
        },
      }),
    },
    {
      id: "moved-from",
      title: "What a moved-from object is",
      body: [
        "`a` is still a valid `std::string`. Its destructor will run correctly and freeing it is safe. But the standard only promises it is in a *valid but unspecified* state.",
        "So you must not read it expecting the old contents. You may assign to it, `clear()` it, or let it go out of scope. For the standard library types this usually means empty — but do not rely on it.",
      ],
      code: CODE,
      activeLines: [11, 12],
      scene: scene({
        owners: [
          { id: "a", name: "a", points: null, state: "danger", note: "do not read" },
          { id: "c", name: "c", points: "A" },
        ],
        bufferA: { state: "live" },
        callout: {
          tone: "danger",
          text: "Reading a moved-from object is not undefined behaviour — it is worse in practice: it is defined to be unpredictable.",
        },
      }),
    },
    {
      id: "reassign",
      title: "Assigning makes it useful again",
      body: [
        "`a = \"safe again\"` puts `a` back into a known state. Assignment to a moved-from object is always allowed.",
        "This is the practical rule: after moving from something, either destroy it or overwrite it. Never inspect it.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        owners: [
          { id: "a", name: "a", points: "B", state: "success", note: '"safe again"' },
          { id: "c", name: "c", points: "A" },
        ],
        bufferA: { state: "live" },
        bufferB: true,
        callout: { tone: "success", text: "Valid again, with new contents and its own storage." },
      }),
    },
    {
      id: "containers",
      title: "Moving into a container",
      body: [
        "`v.push_back(std::move(c))` transfers the buffer into the vector instead of duplicating it. Without the `std::move`, this line would allocate and copy every character.",
        "The same mechanism is why returning a large object by value is cheap in modern C++ — the compiler moves, or elides the copy entirely.",
      ],
      code: CODE,
      activeLines: [15],
      scene: scene({
        owners: [
          { id: "a", name: "a", points: "B" },
          { id: "c", name: "c", points: null, state: "garbage", note: "moved into v" },
        ],
        bufferA: { state: "live", label: "now owned by v[0]" },
        bufferB: true,
        callout: {
          tone: "success",
          text: "Copy when you need two independent values. Move when you are handing one over. The difference is an allocation and a loop.",
        },
      }),
    },
  ],
};
