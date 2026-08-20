import type { Lesson, Region, Scene, TreeNode } from "@/lib/viz/types";

const CODE = `pwd                    # /home/ana
ls                     # relative to where you are

cd projects            # relative path
cd /etc                # absolute path — leading slash
cd ..                  # up one level
cd ~                   # your home directory
cd -                   # back to the previous directory

cat notes.txt          # relative
cat /home/ana/notes.txt  # absolute — same file`;

const TREE: TreeNode[] = [
  { id: "root", label: "/", depth: 0, kind: "dir", note: "the only root — no drive letters" },
  { id: "bin", label: "bin/", depth: 1, kind: "dir", meta: "programs" },
  { id: "etc", label: "etc/", depth: 1, kind: "dir", meta: "system config" },
  { id: "etc-hosts", label: "hosts", depth: 2, kind: "file" },
  { id: "home", label: "home/", depth: 1, kind: "dir" },
  { id: "ana", label: "ana/", depth: 2, kind: "dir", meta: "~" },
  { id: "notes", label: "notes.txt", depth: 3, kind: "file" },
  { id: "projects", label: "projects/", depth: 3, kind: "dir" },
  { id: "app", label: "app.py", depth: 4, kind: "file" },
  { id: "ben", label: "ben/", depth: 2, kind: "dir" },
  { id: "tmp", label: "tmp/", depth: 1, kind: "dir", meta: "scratch" },
  { id: "var", label: "var/", depth: 1, kind: "dir", meta: "logs, spools" },
];

function scene(opts: {
  cwd: string;
  highlight?: string[];
  path?: string;
  resolved?: string;
  callout?: Scene["callout"];
}): Scene {
  const tree: TreeNode[] = TREE.map((node) => ({
    ...node,
    state:
      node.id === opts.cwd
        ? "active"
        : opts.highlight?.includes(node.id)
          ? "read"
          : "idle",
    meta: node.id === opts.cwd ? "← you are here" : node.meta,
  }));

  const regions: Region[] = [
    { id: "fs", kind: "tree", label: "Filesystem", caption: "one tree, one root", tree },
  ];

  if (opts.path) {
    regions.push({
      id: "path",
      kind: "table",
      label: "Path resolution",
      table: {
        columns: [
          { id: "typed", label: "you type" },
          { id: "from", label: "resolved from" },
          { id: "result", label: "absolute path" },
        ],
        rows: [
          {
            id: "row",
            state: "active",
            cells: [
              { id: "p-typed", value: opts.path, state: "active" },
              { id: "p-from", value: opts.path.startsWith("/") ? "the root" : "current directory" },
              { id: "p-result", value: opts.resolved ?? "", state: "success" },
            ],
          },
        ],
      },
    });
  }

  return { regions, callout: opts.callout };
}

export const filesystemTree: Lesson = {
  slug: "filesystem-and-paths",
  track: "linux",
  title: "The filesystem & paths",
  tagline: "One tree, one root, and every path is either from here or from the top.",
  description:
    "Navigate a Linux filesystem and watch absolute and relative paths resolve to the same place — plus what .., ~ and - actually expand to.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "bash",
  filename: "session.sh",
  keywords: ["linux filesystem", "absolute path", "relative path", "cd", "pwd", "directory tree"],
  intro: [
    "On Linux, every file — a program, a photo, a config, a device — lives inside one huge tree. There are no drive letters (no C: or D:); everything hangs off a single root, written as `/`.",
    "Where you \"are\" in that tree is called your **working directory**. Commands like `ls` and `cat` interpret filenames relative to it, which is why the same command can behave differently depending on where you ran it.",
    "This lesson walks through the tree, shows the difference between absolute paths (from the root) and relative paths (from here), and explains what `..` and `~` and `-` actually stand for.",
  ],
  stages: [
    {
      id: "root",
      title: "Everything hangs off /",
      body: [
        "Linux has exactly one filesystem tree, rooted at `/`. There are no drive letters — additional disks and USB sticks are *mounted* into this tree at some directory.",
        "So every file in the system has one absolute path, and it always starts with a slash.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene({
        cwd: "ana",
        callout: { tone: "info", text: "pwd prints where you currently are: /home/ana." },
      }),
    },
    {
      id: "relative",
      title: "A relative path starts from where you are",
      body: [
        "`cd projects` has no leading slash, so the shell resolves it against the current directory: `/home/ana` + `projects` = `/home/ana/projects`.",
        "The same command typed from a different directory would go somewhere completely different — or fail.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        cwd: "projects",
        highlight: ["ana", "home", "root"],
        path: "projects",
        resolved: "/home/ana/projects",
        callout: { tone: "active", text: "No leading slash means \"from here\"." },
      }),
    },
    {
      id: "absolute",
      title: "An absolute path starts from the root",
      body: [
        "`cd /etc` begins with `/`, so the current directory is irrelevant. It resolves from the top of the tree every time.",
        "Absolute paths are what you want in scripts and cron jobs, where you cannot rely on which directory the process started in.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        cwd: "etc",
        highlight: ["root"],
        path: "/etc",
        resolved: "/etc",
        callout: { tone: "active", text: "Leading slash means \"from the root\", wherever you happen to be." },
      }),
    },
    {
      id: "parent",
      title: ".. is the parent directory",
      body: [
        "Every directory contains two hidden entries: `.` meaning itself, and `..` meaning its parent. `cd ..` uses the second one.",
        "They compose, so `../../tmp` walks up twice and back down. At the root, `..` points at the root itself — you cannot go higher.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        cwd: "root",
        path: "..",
        resolved: "/",
        callout: { tone: "info", text: "From /etc, .. is /. From /, .. is still /." },
      }),
    },
    {
      id: "home",
      title: "~ expands before the command sees it",
      body: [
        "`~` is not a directory. The *shell* replaces it with the value of `$HOME` before running anything, so `cd ~` becomes `cd /home/ana`.",
        "`~ben` expands to another user's home. Because this is shell expansion, it does not work inside quotes — `cd \"~\"` will fail.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene({
        cwd: "ana",
        highlight: ["home", "root"],
        path: "~",
        resolved: "/home/ana",
        callout: { tone: "info", text: "Expansion happens in the shell. The cd command only ever sees the final path." },
      }),
    },
    {
      id: "dash",
      title: "cd - returns to the previous directory",
      body: [
        "The shell remembers the last directory you were in as `$OLDPWD`, and `cd -` jumps back to it. Running it twice returns you to where you started.",
        "It is the fastest way to bounce between two distant parts of the tree.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        cwd: "etc",
        highlight: ["ana"],
        path: "-",
        resolved: "/etc  (the previous directory)",
        callout: { tone: "active", text: "A toggle, not a history stack — it only remembers one step." },
      }),
    },
    {
      id: "same-file",
      title: "Two paths, one file",
      body: [
        "From `/home/ana`, both `cat notes.txt` and `cat /home/ana/notes.txt` open exactly the same file. The relative form is shorthand that the shell expands against the current directory.",
        "Use relative paths interactively because they are short; use absolute paths in scripts because they are unambiguous.",
      ],
      code: CODE,
      activeLines: [10, 11],
      scene: scene({
        cwd: "ana",
        highlight: ["notes"],
        path: "notes.txt",
        resolved: "/home/ana/notes.txt",
        callout: {
          tone: "success",
          text: "Leading slash: from the root. No leading slash: from here. That single rule covers every path in Linux.",
        },
      }),
    },
  ],
};
