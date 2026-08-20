import type { Frame, Lesson, Region, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `cat access.log                      # stdout to the terminal

wc -l < access.log                  # stdin from a file
sort names.txt > sorted.txt         # stdout to a file
echo "line" >> sorted.txt           # append instead of truncate

grep ERROR access.log | wc -l       # stdout of one becomes stdin of the next

find / -name "*.conf" 2> /dev/null  # discard stderr only
make > build.log 2>&1               # both streams to one file

cut -d, -f2 data.csv | sort | uniq -c | sort -rn | head -3`;

/** Each process is a block with three numbered streams. */
function process(
  id: string,
  label: string,
  opts: {
    stdin?: string;
    stdout?: string;
    stderr?: string;
    state?: Frame["state"];
    active?: ("in" | "out" | "err")[];
  } = {},
): Frame {
  const on = (which: "in" | "out" | "err") => (opts.active?.includes(which) ? "active" : "idle");

  return {
    id,
    label,
    state: opts.state ?? "active",
    cells: [
      { id: `${id}-in`, name: "0 stdin", value: opts.stdin ?? "terminal", state: on("in"), row: 0 },
      { id: `${id}-out`, name: "1 stdout", value: opts.stdout ?? "terminal", state: on("out"), row: 0 },
      { id: `${id}-err`, name: "2 stderr", value: opts.stderr ?? "terminal", state: on("err"), row: 0 },
    ],
  };
}

function scene(opts: {
  processes: Frame[];
  links?: { from: string; to: string; label?: string; state?: "idle" | "active" | "danger" }[];
  data?: Region;
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      blocksRegion("procs", "Processes", opts.processes, "every process starts with three open streams"),
      ...(opts.data ? [opts.data] : []),
    ],
    arrows: (opts.links ?? []).map((l, i) => ({
      id: `pipe-${i}`,
      from: l.from,
      to: l.to,
      label: l.label,
      state: l.state ?? "active",
    })),
    callout: opts.callout,
  };
}

const dataTable = (rows: string[], footer: string, title: string): Region => ({
  id: "data",
  kind: "table",
  label: title,
  table: {
    columns: [{ id: "line", label: "line" }],
    rows: rows.map((r, i) => ({
      id: `d${i}`,
      label: String(i + 1),
      cells: [{ id: `dc${i}`, value: r, state: r.includes("ERROR") ? "active" : "idle" }],
    })),
    footer,
  },
});

export const pipesAndRedirection: Lesson = {
  slug: "pipes-and-redirection",
  track: "linux",
  title: "Pipes & redirection",
  tagline: "Every process is born with three streams. Redirection just re-plugs them.",
  description:
    "Watch stdin, stdout and stderr get rewired by <, >, >> and |, see why 2>&1 has to come last, and follow data through a four-stage pipeline.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "bash",
  filename: "session.sh",
  keywords: ["pipes", "stdout", "stderr", "redirection", "2>&1", "shell pipeline"],
  intro: [
    "Every Linux program starts with three connections: **stdin** (an input stream, usually the keyboard), **stdout** (normal output, usually the terminal), and **stderr** (error output, also to the terminal by default).",
    "The shell's superpower is that you can re-plug those connections without the program knowing. `> file` sends stdout to a file. `< file` reads stdin from a file. `|` connects one program's stdout to the next program's stdin.",
    "This lesson watches those three streams get rewired: to a file, to another program, and both at once. That's the whole basis of the Unix pipeline philosophy: small tools composed into big work.",
  ],
  stages: [
    {
      id: "streams",
      title: "Three streams, opened for you",
      body: [
        "Every process starts with three file descriptors already open: 0 is standard input, 1 is standard output, 2 is standard error. By default all three are connected to your terminal.",
        "Nothing in the program knows or cares what is on the other end. That indifference is what makes redirection possible.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene({
        processes: [process("cat", "cat access.log", { active: ["out"] })],
        callout: { tone: "active", text: "cat writes to descriptor 1. Today that happens to be your screen." },
      }),
    },
    {
      id: "stdin",
      title: "< replaces stdin with a file",
      body: [
        "`wc -l < access.log` opens the file and attaches it to descriptor 0. `wc` reads its input exactly as before, unaware that it is coming from disk rather than the keyboard.",
        "This differs from `wc -l access.log`, where `wc` opens the file itself and can therefore print its name. Same output count, different mechanism.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        processes: [process("wc", "wc -l", { stdin: "access.log", active: ["in"] })],
        callout: { tone: "active", text: "The shell sets this up before the program starts running." },
      }),
    },
    {
      id: "stdout",
      title: "> sends stdout to a file — and truncates it",
      body: [
        "`sort names.txt > sorted.txt` points descriptor 1 at the file. Critically, the shell **creates or empties** that file before `sort` even begins.",
        "This is why `sort file.txt > file.txt` destroys your data: the file is truncated to zero length first, and then `sort` reads nothing.",
      ],
      code: CODE,
      activeLines: [4, 5],
      scene: scene({
        processes: [process("sort", "sort names.txt", { stdout: "sorted.txt", active: ["out"] })],
        callout: {
          tone: "danger",
          text: "> truncates first, always. Use >> to append, or write to a different file and rename.",
        },
      }),
    },
    {
      id: "pipe",
      title: "| connects one process to the next",
      body: [
        "A pipe attaches the stdout of the left command directly to the stdin of the right one, through a small in-kernel buffer. No temporary file is involved.",
        "Both processes run **at the same time**. If the reader is slow, the writer blocks once the buffer fills — which is what lets a pipeline stream a file far larger than memory.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene({
        processes: [
          process("grep", "grep ERROR access.log", { stdout: "pipe", active: ["out"] }),
          process("wc", "wc -l", { stdin: "pipe", active: ["in"] }),
        ],
        links: [{ from: "grep-out", to: "wc-in", label: "pipe" }],
        data: dataTable(
          ["GET /ok 200", "GET /bad 500 ERROR", "GET /ok 200", "POST /x 503 ERROR"],
          "grep passes 2 of 4 lines through",
          "flowing through the pipe",
        ),
        callout: { tone: "active", text: "Concurrent, not sequential. grep does not finish before wc starts." },
      }),
    },
    {
      id: "stderr",
      title: "stderr does not travel down a pipe",
      body: [
        "Errors go to descriptor 2, which a plain `|` leaves alone. That is deliberate: a diagnostic message should not silently become part of your data.",
        "`find / -name \"*.conf\" 2> /dev/null` throws away only the permission-denied noise, leaving the actual results on stdout untouched.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        processes: [
          process("find", "find / -name *.conf", {
            stdout: "terminal",
            stderr: "/dev/null",
            active: ["err"],
          }),
        ],
        callout: {
          tone: "info",
          text: "This is why errors still appear on screen when you redirect a command's output to a file.",
        },
      }),
    },
    {
      id: "combine",
      title: "2>&1 means \"send 2 wherever 1 currently goes\"",
      body: [
        "`make > build.log 2>&1` works because order matters. First stdout is pointed at the file; then stderr is made a duplicate of stdout, which by now means the file.",
        "Reverse them — `2>&1 > build.log` — and stderr is duplicated to the *terminal* first, then stdout alone is redirected. A genuinely common mistake, and a silent one.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        processes: [
          process("make", "make", {
            stdout: "build.log",
            stderr: "build.log",
            active: ["out", "err"],
          }),
        ],
        callout: {
          tone: "active",
          text: "Read it as a copy of the current target, not a permanent link. Bash also offers &> build.log as shorthand.",
        },
      }),
    },
    {
      id: "pipeline",
      title: "A real pipeline is a sentence",
      body: [
        "`cut -d, -f2 data.csv | sort | uniq -c | sort -rn | head -3` reads as: take column 2, sort it, count runs of duplicates, sort those counts descending, show the top three.",
        "Each tool does one small thing and knows nothing about the others. `uniq -c` requires sorted input, which is why `sort` appears before it — a detail that catches everyone once.",
        "Four processes run concurrently, passing data through in a stream. This is the entire Unix philosophy in one line.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        processes: [
          process("cut", "cut -d, -f2", { stdin: "data.csv", stdout: "pipe" }),
          process("sort1", "sort", { stdin: "pipe", stdout: "pipe" }),
          process("uniq", "uniq -c", { stdin: "pipe", stdout: "pipe" }),
          process("head", "sort -rn | head -3", { stdin: "pipe", active: ["out"] }),
        ],
        links: [
          { from: "cut-out", to: "sort1-in" },
          { from: "sort1-out", to: "uniq-in" },
          { from: "uniq-out", to: "head-in" },
        ],
        callout: {
          tone: "success",
          text: "Small tools, one job each, composed with |. No temporary files, no loading the whole dataset into memory.",
        },
      }),
    },
  ],
};
