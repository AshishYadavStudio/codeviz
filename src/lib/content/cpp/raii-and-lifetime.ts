import type { Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <cstdio>

struct File {
    FILE *handle;

    File(const char *path) {          // constructor: acquire
        handle = fopen(path, "r");
        printf("opened\\n");
    }
    ~File() {                          // destructor: release
        if (handle) fclose(handle);
        printf("closed\\n");
    }
};

void read_config() {
    File f("config.txt");
    if (!f.handle) return;             // early return — still closed
    // ... use f ...
}                                      // destructor runs here

int main() {
    read_config();
    return 0;
}`;

function scene(opts: {
  frames: Frame[];
  heap?: Frame[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      stackRegion(opts.frames),
      ...(opts.heap ? [heapRegion(opts.heap, "the OS resource behind the handle")] : []),
    ],
    callout: opts.callout,
  };
}

const mainFrame = (state: Frame["state"] = "idle"): Frame => ({
  id: "main",
  label: "main()",
  state,
  cells: [],
});

export const raiiAndLifetime: Lesson = {
  slug: "raii-and-lifetime",
  track: "cpp",
  title: "RAII: constructors, destructors & scope",
  tagline: "The closing brace is the cleanup code. That is the whole idea.",
  description:
    "Watch a resource get acquired by a constructor and released automatically by a destructor at the closing brace — including on an early return, which is where manual cleanup fails.",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "cpp",
  keywords: ["RAII", "destructor", "constructor", "c++ scope", "resource management"],
  intro: [
    "**RAII** stands for \"Resource Acquisition Is Initialisation\" — an unhelpful name for a very useful idea: tie every resource (memory, file, lock, socket) to the lifetime of a stack variable, so when the variable goes out of scope, its cleanup runs automatically.",
    "The **constructor** grabs the resource; the **destructor** releases it. Because destructors fire at the closing brace, cleanup happens for you — even if the function throws an exception or returns early.",
    "This lesson watches a `File` object open a file in its constructor and close it in its destructor, so you can see cleanup happen the instant the object goes out of scope.",
  ],
  stages: [
    {
      id: "enter",
      title: "read_config() is called",
      body: [
        "A frame is pushed. Nothing has been constructed yet — `f` is a name the compiler knows about, but its constructor has not run.",
        "In C you would now write `fopen`, and mentally note that every exit path from this function must call `fclose`.",
      ],
      code: CODE,
      activeLines: [23],
      scene: scene({
        frames: [mainFrame(), { id: "rc", label: "read_config()", state: "active", cells: [] }],
        callout: { tone: "info", text: "The problem RAII solves: every early return, break, and throw is a leak waiting to happen." },
      }),
    },
    {
      id: "construct",
      title: "The constructor acquires",
      body: [
        "`File f(\"config.txt\")` runs the constructor, which calls `fopen`. The object `f` now exists in the frame, holding the handle.",
        "Acquisition and initialisation are the same event — that is the *RAII* acronym: resource acquisition **is** initialisation.",
      ],
      code: CODE,
      activeLines: [17, 6, 7],
      scene: scene({
        frames: [
          mainFrame(),
          {
            id: "rc",
            label: "read_config()",
            state: "active",
            cells: [
              {
                id: "f",
                name: "f",
                type: "File",
                value: "handle",
                address: "0x7ffd2200",
                state: "active",
                row: 0,
              },
            ],
          },
        ],
        heap: [
          {
            id: "os",
            label: "open file description",
            state: "active",
            badge: "config.txt",
            cells: [
              { id: "fd", name: "fd", value: "3", state: "allocated", row: 0 },
            ],
          },
        ],
        callout: { tone: "active", text: "The object owns the resource now. Nobody has to remember anything." },
      }),
    },
    {
      id: "early-return",
      title: "An early return still cleans up",
      body: [
        "Suppose the file failed to open and the function returns on line 20. In C, that return would skip your `fclose` unless you wrote it twice — or used a `goto cleanup` label.",
        "In C++ the destructor runs on *every* path out of the scope, including this one. There is no path that forgets.",
      ],
      code: CODE,
      activeLines: [18],
      scene: scene({
        frames: [
          mainFrame(),
          {
            id: "rc",
            label: "read_config()",
            state: "returning",
            note: "returning early — destructor still runs",
            cells: [
              {
                id: "f",
                name: "f",
                type: "File",
                value: "handle",
                address: "0x7ffd2200",
                state: "read",
                row: 0,
              },
            ],
          },
        ],
        heap: [
          {
            id: "os",
            label: "open file description",
            badge: "config.txt",
            cells: [{ id: "fd", name: "fd", value: "3", row: 0 }],
          },
        ],
        callout: {
          tone: "info",
          text: "Same for a thrown exception: the stack unwinds and every destructor along the way runs.",
        },
      }),
    },
    {
      id: "destruct",
      title: "The closing brace releases",
      body: [
        "Control reaches `}` on line 20. Before the frame is popped, the destructor of every local object runs — in reverse order of construction.",
        "`~File()` calls `fclose`. The resource is returned to the operating system without a single line of cleanup code at the call site.",
      ],
      code: CODE,
      activeLines: [20, 10, 11],
      scene: scene({
        frames: [
          mainFrame(),
          {
            id: "rc",
            label: "read_config()",
            state: "returning",
            note: "~File() running",
            cells: [
              {
                id: "f",
                name: "f",
                type: "File",
                value: "handle",
                address: "0x7ffd2200",
                state: "freed",
                row: 0,
              },
            ],
          },
        ],
        heap: [
          {
            id: "os",
            label: "open file description",
            state: "popped",
            badge: "closed",
            cells: [{ id: "fd", name: "fd", value: "—", state: "freed", row: 0 }],
          },
        ],
        callout: { tone: "success", text: "Scope exit is the cleanup trigger. No leak is possible here, by construction." },
      }),
    },
    {
      id: "popped",
      title: "Back in main, with nothing left over",
      body: [
        "The frame is gone and so is the resource. The object's lifetime and the resource's lifetime were the same lifetime.",
        "This is why C++ code that manages memory, locks, sockets and files often has no visible cleanup at all: it is in the destructors.",
      ],
      code: CODE,
      activeLines: [24],
      scene: scene({
        frames: [mainFrame("active")],
        callout: {
          tone: "success",
          text: "std::lock_guard, std::unique_ptr, std::fstream and std::vector are all this same pattern.",
        },
      }),
    },
    {
      id: "order",
      title: "Destruction is exactly reverse construction",
      body: [
        "If a scope constructs `a`, then `b`, then `c`, destruction runs `~c`, `~b`, `~a`. This matters when later objects depend on earlier ones — a lock guard declared after the thing it protects is destroyed first.",
        "The same rule applies to class members: they are constructed in declaration order and destroyed in reverse, regardless of the order you list them in the initialiser list.",
      ],
      code: CODE,
      activeLines: [10, 11, 12],
      scene: scene({
        frames: [
          mainFrame(),
          {
            id: "rc",
            label: "scope",
            state: "active",
            badge: "construct → , destruct ←",
            cells: [
              { id: "a", name: "a", value: "1st", state: "success", row: 0 },
              { id: "b", name: "b", value: "2nd", state: "success", row: 0 },
              { id: "c", name: "c", value: "3rd", state: "active", row: 0 },
            ],
            note: "~c runs first, then ~b, then ~a",
          },
        ],
        callout: {
          tone: "info",
          text: "Reverse order is what makes dependencies safe: nothing is destroyed while something built on top of it still exists.",
        },
      }),
    },
  ],
};
