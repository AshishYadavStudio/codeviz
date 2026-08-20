import type { CellState, Lesson, Region, TableRow } from "@/lib/viz/types";

const CODE = `# Basic grep: lines containing "error"
grep "error" server.log

# Case-insensitive
grep -i "error" server.log

# Line numbers
grep -n "error" server.log

# Invert: lines NOT containing "error"
grep -v "error" server.log

# Extended regex: one or more digits
grep -E "[0-9]+" server.log

# Anchors: lines starting with "2024"
grep "^2024" server.log

# Pipe: filter output of another command
ps aux | grep nginx`;

const LINES = [
  { id: "1", text: "2024-01-15 INFO  startup complete", has: false },
  { id: "2", text: "2024-01-15 ERROR connection timeout", has: true },
  { id: "3", text: "2024-01-15 INFO  request handled", has: false },
  { id: "4", text: "2024-01-15 WARN  high latency", has: false },
  { id: "5", text: "2024-01-15 ERROR disk full", has: true },
  { id: "6", text: "2024-01-16 INFO  recovered", has: false },
];

function logTable(opts: {
  label: string;
  predicate: (line: typeof LINES[0]) => boolean;
  highlightWord?: string;
  footer?: string;
}): Region {
  const rows: TableRow[] = LINES.map((line) => {
    const match = opts.predicate(line);
    return {
      id: `r${line.id}`,
      label: line.id,
      state: match ? "success" : ("idle" as CellState),
      cells: [
        {
          id: `r${line.id}-text`,
          value: line.text,
          state: match ? "success" : ("idle" as CellState),
        },
      ],
    };
  });

  return {
    id: "log",
    kind: "table",
    label: opts.label,
    caption: "grep scans line by line",
    table: {
      columns: [{ id: "line", label: "server.log" }],
      rows,
      footer: opts.footer,
    },
  };
}

function resultTable(lines: typeof LINES, label: string): Region {
  return {
    id: "result",
    kind: "table",
    label,
    table: {
      columns: [{ id: "match", label: "output" }],
      rows: lines.map((l) => ({
        id: `m${l.id}`,
        label: l.id,
        state: "success" as CellState,
        cells: [{ id: `m${l.id}-text`, value: l.text, state: "success" as CellState }],
      })),
    },
  };
}

export const grepAndRegex: Lesson = {
  slug: "grep-and-regex",
  track: "linux",
  title: "grep & regular expressions",
  tagline: "Matching lines, and the difference between basic and extended regex.",
  description:
    "Watch grep scan a log file line by line, see which lines match a pattern and which are discarded, and learn the most useful flags (-i, -n, -v, -E) and regex anchors.",
  difficulty: 2,
  minutes: 8,
  access: "free",
  language: "bash",
  filename: "session.sh",
  keywords: ["grep", "regex", "regular expression", "pattern matching", "log file", "pipeline"],
  intro: [
    "`grep` searches text for lines that match a pattern and prints them. That's the entire job. But because it works on any stream — a file, the output of another command — it turns into one of the most-used tools you'll ever meet.",
    "The pattern can be a literal string (`grep error log.txt`) or a **regular expression** — a small language for describing shapes of text (`grep -E \"^[0-9]+ ERROR\"`).",
    "This lesson runs grep on a log file, shows which lines are kept and which are dropped, then covers the flags you'll actually use daily: `-i`, `-n`, `-v`, and `-E`.",
  ],
  stages: [
    {
      id: "basic",
      title: "grep prints lines containing the pattern",
      body: [
        "`grep \"error\" server.log` reads every line of the file and prints only those containing the string \"error\". Case matters — \"ERROR\" would not match.",
        "grep does not modify the file. It reads, filters, and writes to stdout. The original file is untouched.",
      ],
      code: CODE,
      activeLines: [2],
      scene: {
        regions: [
          logTable({ label: "server.log", predicate: (l) => l.text.includes("ERROR") }),
        ],
        callout: { tone: "info", text: "\"error\" does not match \"ERROR\". grep is case-sensitive by default." },
      },
    },
    {
      id: "case",
      title: "-i: case-insensitive",
      body: [
        "`grep -i \"error\"` matches \"error\", \"ERROR\", \"Error\" — any casing. This is the flag you want for log files where the case is inconsistent.",
        "Two lines match: the CONNECTION TIMEOUT and the DISK FULL entries.",
      ],
      code: CODE,
      activeLines: [5],
      scene: {
        regions: [
          logTable({
            label: "grep -i \"error\"",
            predicate: (l) => l.text.toLowerCase().includes("error"),
            footer: "2 matches",
          }),
        ],
        callout: { tone: "active", text: "-i ignores case. \"error\" matches \"ERROR\"." },
      },
    },
    {
      id: "invert",
      title: "-v: lines that do NOT match",
      body: [
        "`grep -v \"ERROR\"` inverts the match: it prints every line that does *not* contain \"ERROR\". This is how you filter out noise.",
        "Combined with `-i`, you can exclude patterns regardless of case.",
      ],
      code: CODE,
      activeLines: [11],
      scene: {
        regions: [
          logTable({
            label: "grep -v \"ERROR\"",
            predicate: (l) => !l.text.includes("ERROR"),
            footer: "4 lines kept (errors excluded)",
          }),
        ],
        callout: { tone: "active", text: "-v inverts: keep everything EXCEPT the match." },
      },
    },
    {
      id: "regex",
      title: "-E: extended regex",
      body: [
        "`grep -E \"[0-9]+\"` uses extended regular expressions. `[0-9]` matches any digit, `+` means one or more. Every line with a number matches.",
        "Without `-E`, you would need to escape the `+` as `\\+`. Extended mode is what most people expect from regex.",
      ],
      code: CODE,
      activeLines: [14],
      scene: {
        regions: [
          logTable({
            label: "grep -E \"[0-9]+\"",
            predicate: () => true,
            footer: "all 6 lines contain digits",
          }),
        ],
        callout: { tone: "info", text: "-E for extended regex. [0-9]+ matches one or more digits." },
      },
    },
    {
      id: "anchor",
      title: "^ anchors to the start of a line",
      body: [
        "`^2024` matches lines that *start with* 2024. Without `^`, it would match 2024 anywhere in the line.",
        "The other anchor is `$`: `\\.log$` matches lines ending with `.log`. Together, `^$` matches empty lines.",
      ],
      code: CODE,
      activeLines: [17],
      scene: {
        regions: [
          logTable({
            label: "grep \"^2024\"",
            predicate: (l) => l.text.startsWith("2024"),
            footer: "all 6 start with 2024",
          }),
        ],
        callout: { tone: "active", text: "^ = start of line. $ = end of line. Together they anchor the match." },
      },
    },
    {
      id: "pipe",
      title: "grep in a pipeline",
      body: [
        "`ps aux | grep nginx` runs `ps aux` and feeds its output into grep as input. grep filters it to lines containing \"nginx\".",
        "This is the most common grep pattern: pipe the output of any command into grep to find the lines you care about.",
      ],
      code: CODE,
      activeLines: [20],
      scene: {
        regions: [
          resultTable(
            [{ id: "ps1", text: "www  1234  0.1  nginx: master", has: true }],
            "ps aux | grep nginx",
          ),
        ],
        callout: {
          tone: "success",
          text: "grep filters any stream, not just files. That is what makes it a pipeline tool.",
        },
      },
    },
  ],
};
