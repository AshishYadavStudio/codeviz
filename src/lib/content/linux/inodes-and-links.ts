import type { Arrow, Frame, Lesson, Region, Scene, TreeNode } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `ls -li notes.txt          # -i shows the inode number

ln notes.txt hard.txt     # hard link: a second name
ln -s notes.txt soft.txt  # symlink: a file containing a path

rm notes.txt              # hard.txt still works, soft.txt breaks

df -i                     # inodes can run out before disk space does`;

interface Entry {
  id: string;
  name: string;
  inode: string;
  state?: TreeNode["state"];
  kind?: TreeNode["kind"];
  note?: string;
}

function directoryRegion(entries: Entry[]): Region {
  return {
    id: "dir",
    kind: "table",
    label: "Directory: /home/ana",
    caption: "a directory is a list of name → inode pairs",
    table: {
      columns: [
        { id: "name", label: "name" },
        { id: "inode", label: "inode" },
      ],
      rows: entries.map((e) => ({
        id: e.id,
        state: e.state === "danger" ? "danger" : e.state === "active" ? "active" : "idle",
        cells: [
          { id: `${e.id}-n`, value: e.name, state: e.state },
          { id: `${e.id}-i`, value: e.inode, state: e.state },
        ],
      })),
    },
  };
}

function inodeRegion(opts: { links: number; alive: boolean; active?: boolean }): Frame[] {
  return [
    {
      id: "inode",
      label: "inode 4218",
      state: opts.alive ? (opts.active ? "active" : "idle") : "popped",
      badge: opts.alive ? `link count ${opts.links}` : "link count 0 — data freed",
      cells: [
        {
          id: "inode-meta",
          name: "mode/owner/size",
          value: "rw-r--r-- ana 1024",
          state: opts.alive ? "idle" : "freed",
          row: 0,
        },
        {
          id: "inode-data",
          name: "data blocks",
          value: opts.alive ? "→ disk blocks" : "released",
          state: opts.alive ? (opts.active ? "active" : "idle") : "freed",
          row: 0,
        },
      ],
    },
  ];
}

function scene(opts: {
  entries: Entry[];
  links: number;
  alive: boolean;
  active?: boolean;
  symlinkTo?: string;
  callout?: Scene["callout"];
}): Scene {
  const arrows: Arrow[] = opts.entries
    .filter((e) => e.inode === "4218")
    .map((e) => ({
      id: `${e.id}-arrow`,
      from: `${e.id}-i`,
      to: "inode-meta",
      state: e.state === "active" ? "active" : "idle",
    }));

  return {
    regions: [
      directoryRegion(opts.entries),
      blocksRegion(
        "inodes",
        "Inode table",
        inodeRegion({ links: opts.links, alive: opts.alive, active: opts.active }),
        "the file itself — metadata and where the data lives",
      ),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const inodesAndLinks: Lesson = {
  slug: "inodes-and-links",
  track: "linux",
  title: "Inodes, hard links & symlinks",
  tagline: "A filename is not the file. It is a directory entry pointing at one.",
  description:
    "See what a directory actually stores, why two names can be the same file, how deleting works by decrementing a counter, and why a symlink breaks where a hard link does not.",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "bash",
  filename: "session.sh",
  keywords: ["inode", "hard link", "symlink", "ln", "unlink", "filesystem internals"],
  stages: [
    {
      id: "inode",
      title: "The file is the inode, not the name",
      body: [
        "An inode holds everything about a file except its name: permissions, owner, size, timestamps, and pointers to the data blocks on disk.",
        "A directory is simply a table mapping names to inode numbers. `ls -li` prints that number.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene({
        entries: [{ id: "e1", name: "notes.txt", inode: "4218", state: "active" }],
        links: 1,
        alive: true,
        active: true,
        callout: { tone: "active", text: "One name, one inode, link count 1." },
      }),
    },
    {
      id: "hard",
      title: "A hard link is a second name for the same inode",
      body: [
        "`ln notes.txt hard.txt` adds another directory entry pointing at inode 4218 and increments its link count to 2.",
        "Neither name is the \"original\" — they are equal in every respect. Writing through one is immediately visible through the other, because there is only one file.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        entries: [
          { id: "e1", name: "notes.txt", inode: "4218" },
          { id: "e2", name: "hard.txt", inode: "4218", state: "active" },
        ],
        links: 2,
        alive: true,
        active: true,
        callout: { tone: "active", text: "Two entries, one inode. No data was copied — this costs one directory entry." },
      }),
    },
    {
      id: "soft",
      title: "A symlink is a small file containing a path",
      body: [
        "`ln -s notes.txt soft.txt` creates an entirely different file, with its own inode, whose contents are the *text* `\"notes.txt\"`.",
        "Opening it makes the kernel read that path and start again from there. The link count on 4218 does not change, because nothing new points at it.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        entries: [
          { id: "e1", name: "notes.txt", inode: "4218" },
          { id: "e2", name: "hard.txt", inode: "4218" },
          { id: "e3", name: "soft.txt → notes.txt", inode: "4301", state: "read" },
        ],
        links: 2,
        alive: true,
        callout: {
          tone: "info",
          text: "A symlink stores a path, so it can cross filesystems and point at directories. A hard link can do neither.",
        },
      }),
    },
    {
      id: "delete",
      title: "rm removes a name and decrements the count",
      body: [
        "The system call is literally named `unlink`. It deletes the directory entry and reduces the link count from 2 to 1.",
        "The data is untouched, because something still refers to it. `hard.txt` opens the same file it always did.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        entries: [
          { id: "e2", name: "hard.txt", inode: "4218", state: "active" },
          { id: "e3", name: "soft.txt → notes.txt", inode: "4301", state: "danger", note: "dangling" },
        ],
        links: 1,
        alive: true,
        active: true,
        callout: {
          tone: "danger",
          text: "soft.txt now points at a name that no longer exists — a broken symlink. hard.txt is completely fine.",
        },
      }),
    },
    {
      id: "zero",
      title: "At zero links the data is released",
      body: [
        "Remove the last name and the count reaches 0, so the filesystem frees the inode and its data blocks.",
        "With one important exception: if a process still has the file **open**, the data survives until that descriptor closes. This is how deleting a log file fails to free disk space until you restart the service.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        entries: [{ id: "e3", name: "soft.txt → notes.txt", inode: "4301", state: "danger" }],
        links: 0,
        alive: false,
        callout: {
          tone: "info",
          text: "Deletion is reference counting — names on disk plus open descriptors in memory.",
        },
      }),
    },
    {
      id: "exhaustion",
      title: "Inodes are a finite, separate resource",
      body: [
        "A filesystem is created with a fixed number of inodes. Millions of tiny files can exhaust them while `df -h` still reports plenty of free space, and writes start failing with \"No space left on device\".",
        "`df -i` shows the inode usage. It is the first thing to check when that error appears on a disk that is visibly not full.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        entries: [{ id: "e2", name: "hard.txt", inode: "4218" }],
        links: 1,
        alive: true,
        callout: {
          tone: "success",
          text: "Names live in directories, files live in inodes, data lives in blocks. Links are just extra names.",
        },
      }),
    },
  ],
};
