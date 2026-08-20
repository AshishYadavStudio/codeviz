import type { CellState, Frame, Lesson, Region, Scene } from "@/lib/viz/types";
import { bitRegion } from "@/lib/viz/scene-helpers";

const CODE = `ls -l notes.txt
# -rw-r--r--  1 ana  staff  1024 Aug 14 09:12 notes.txt

chmod 644 notes.txt      # rw- r-- r--
chmod 755 script.sh      # rwx r-x r-x
chmod u+x script.sh      # symbolic: add execute for the owner
chmod go-w shared.txt    # remove write for group and others

umask                    # 022 — bits masked off from new files`;

type Triad = { r: boolean; w: boolean; x: boolean };

const triad = (value: number): Triad => ({
  r: (value & 4) !== 0,
  w: (value & 2) !== 0,
  x: (value & 1) !== 0,
});

const rwx = (t: Triad) => `${t.r ? "r" : "-"}${t.w ? "w" : "-"}${t.x ? "x" : "-"}`;

/** Nine permission bits, grouped as the three triads chmod actually uses. */
function bitLanes(mode: [number, number, number], highlight?: 0 | 1 | 2): Frame[] {
  const labels = ["owner", "group", "others"];

  return mode.map((value, i) => {
    const t = triad(value);
    const flags: [string, boolean][] = [
      ["r", t.r],
      ["w", t.w],
      ["x", t.x],
    ];

    return {
      id: `lane-${i}`,
      label: labels[i],
      badge: `${rwx(t)}  ·  ${value}`,
      cells: flags.map(([flag, on]) => ({
        id: `${labels[i]}-${flag}`,
        value: on ? "1" : "0",
        note: flag,
        state: (highlight === i
          ? on
            ? "active"
            : "idle"
          : on
            ? "read"
            : "idle") as CellState,
      })),
    };
  });
}

function scene(opts: {
  mode: [number, number, number];
  highlight?: 0 | 1 | 2;
  who?: string;
  verdict?: { text: string; allowed: boolean };
  callout?: Scene["callout"];
}): Scene {
  const regions: Region[] = [
    bitRegion(
      "perm",
      "Permission bits",
      bitLanes(opts.mode, opts.highlight),
      `mode ${opts.mode.join("")} · read 4, write 2, execute 1`,
    ),
  ];

  if (opts.verdict) {
    regions.push({
      id: "check",
      kind: "table",
      label: "Access check",
      table: {
        columns: [
          { id: "who", label: "requesting user" },
          { id: "class", label: "matched class" },
          { id: "result", label: "result" },
        ],
        rows: [
          {
            id: "verdict",
            state: opts.verdict.allowed ? "success" : "danger",
            cells: [
              { id: "v-who", value: opts.who ?? "" },
              { id: "v-class", value: ["owner", "group", "others"][opts.highlight ?? 2] },
              {
                id: "v-result",
                value: opts.verdict.text,
                state: opts.verdict.allowed ? "success" : "danger",
              },
            ],
          },
        ],
      },
    });
  }

  return { regions, callout: opts.callout };
}

export const filePermissions: Lesson = {
  slug: "file-permissions",
  track: "linux",
  title: "File permissions & chmod",
  tagline: "Nine bits, three groups of three. 644 is not a magic number — it is binary.",
  description:
    "See the nine permission bits behind rw-r--r--, why chmod 755 means what it means, how the kernel picks exactly one triad to check, and what execute does on a directory.",
  difficulty: 1,
  minutes: 9,
  access: "free",
  language: "bash",
  filename: "session.sh",
  keywords: ["chmod", "file permissions", "umask", "rwx", "linux security", "octal permissions"],
  stages: [
    {
      id: "read-it",
      title: "rw-r--r-- is nine bits in disguise",
      body: [
        "`ls -l` prints ten characters. The first is the file type — `-` for a regular file, `d` for a directory, `l` for a symlink. The remaining nine are three groups of three.",
        "Each group answers the same three questions — read? write? execute? — for a different class of user: the owner, the file's group, and everyone else.",
      ],
      code: CODE,
      activeLines: [1, 2],
      scene: scene({
        mode: [6, 4, 4],
        callout: { tone: "info", text: "rw- r-- r--: the owner can read and write, everyone else can only read." },
      }),
    },
    {
      id: "octal",
      title: "Why 644",
      body: [
        "Within each triad, read is worth 4, write 2, execute 1 — the three bit positions. Add up the ones that are set and you get a digit from 0 to 7.",
        "`rw-` is 4 + 2 = 6. `r--` is 4. So `rw-r--r--` is 644. The number is just the bits written in octal, one digit per triad.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        mode: [6, 4, 4],
        highlight: 0,
        callout: { tone: "active", text: "4 + 2 + 0 = 6 for the owner. One octal digit encodes exactly three bits." },
      }),
    },
    {
      id: "executable",
      title: "755 makes something runnable",
      body: [
        "`rwx` is 4 + 2 + 1 = 7 for the owner; `r-x` is 5 for everyone else. This is the standard mode for a script or program: anyone may run it, only the owner may change it.",
        "Without the execute bit, a perfectly valid script fails with \"Permission denied\" — the kernel refuses to run it no matter what the file contains.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        mode: [7, 5, 5],
        highlight: 0,
        callout: { tone: "active", text: "Execute is what separates a script from a text file that happens to contain commands." },
      }),
    },
    {
      id: "which-triad",
      title: "The kernel checks exactly one triad",
      body: [
        "Permissions are not cumulative. The kernel picks the *first* matching class and stops: are you the owner? If so, the owner bits decide, and the group and other bits are never consulted.",
        "This surprises people: a file with mode `047` gives the owner no access at all, while everyone else can read and write it. Being the owner does not fall back to the wider permissions.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene({
        mode: [0, 4, 7],
        highlight: 0,
        who: "ana (the owner)",
        verdict: { text: "denied — owner triad is ---", allowed: false },
        callout: {
          tone: "danger",
          text: "First match wins. Owner, then group, then others — and only one of them is ever used.",
        },
      }),
    },
    {
      id: "symbolic",
      title: "Symbolic mode changes bits without restating them",
      body: [
        "`chmod u+x script.sh` adds execute for the user (owner) and leaves every other bit exactly as it was. `chmod go-w` removes write for group and others.",
        "The letters are `u` user, `g` group, `o` others, `a` all; the operators are `+` add, `-` remove, `=` set exactly.",
        "Prefer symbolic mode when adjusting one thing — with octal you must restate all nine bits, and it is easy to widen access by accident.",
      ],
      code: CODE,
      activeLines: [6, 7],
      scene: scene({
        mode: [7, 4, 4],
        highlight: 0,
        callout: { tone: "active", text: "u+x turned 644 into 744 without touching the group or other bits." },
      }),
    },
    {
      id: "directories",
      title: "On a directory the bits mean something different",
      body: [
        "For a directory, **read** means you can list the names inside it. **Write** means you can create, rename and delete entries. **Execute** — often called the search bit — means you can traverse into it and reach things by path.",
        "That is why write permission on a directory lets you delete a file you do not own: deletion modifies the *directory*, not the file. And why `r` without `x` lets you see filenames but not open any of them.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        mode: [7, 5, 5],
        highlight: 2,
        who: "someone else",
        verdict: { text: "may enter and list, may not create or delete", allowed: true },
        callout: {
          tone: "info",
          text: "A directory with x but not r: you can open a file if you already know its exact name, but you cannot discover it.",
        },
      }),
    },
    {
      id: "umask",
      title: "umask decides what new files start with",
      body: [
        "New files are requested with mode 666 and new directories with 777. The umask is then subtracted — it is a mask of bits to *remove*.",
        "The common default of `022` clears write for group and others, so files land on 644 and directories on 755. That is exactly the pattern you have been looking at.",
        "Note that files never get the execute bit automatically, whatever the umask. You always have to add it deliberately.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        mode: [6, 4, 4],
        callout: {
          tone: "success",
          text: "666 − 022 = 644 for files, 777 − 022 = 755 for directories. Same arithmetic, different starting point.",
        },
      }),
    },
  ],
};
