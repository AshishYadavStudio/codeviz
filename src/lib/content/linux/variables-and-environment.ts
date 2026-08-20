import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `# Shell variable — local to this shell
greeting="hello"
echo $greeting          # hello

# Export makes it visible to child processes
export PATH="/usr/bin:/bin"
export EDITOR="vim"

# Child process inherits exported variables
bash -c 'echo $EDITOR'   # vim
bash -c 'echo $greeting' # (empty — not exported)

# env shows all exported variables
env | grep EDITOR

# Unsetting
unset greeting
echo $greeting            # (empty)`;

function scene(opts: {
  shell: { id: string; name: string; value: string; exported: boolean; state?: CellState }[];
  child?: { id: string; name: string; value: string; state?: CellState }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      blocksRegion("shell", "Current shell", opts.shell.map((v) => ({
        id: v.id,
        label: v.name,
        cells: [{
          id: `${v.id}-val`,
          value: v.value,
          state: v.state ?? "idle",
          note: v.exported ? "exported" : "local only",
        }],
      })), "variables live in the shell process"),
      ...(opts.child
        ? [blocksRegion("child", "Child process (bash -c)", opts.child.map((v) => ({
            id: v.id,
            label: v.name,
            cells: [{
              id: `${v.id}-val`,
              value: v.value,
              state: v.state ?? "idle",
              note: v.value ? "inherited" : "not inherited",
            }],
          })), "only exported variables are copied")]
        : []),
    ],
    callout: opts.callout,
  };
}

export const variablesAndEnvironment: Lesson = {
  slug: "variables-and-environment",
  track: "linux",
  title: "Variables & the environment",
  tagline: "Shell variables, exported variables, and what a child process inherits.",
  description:
    "See the difference between a shell variable (local to your session) and an exported environment variable (inherited by child processes), and why scripts fail when they assume a variable was exported.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "bash",
  filename: "session.sh",
  keywords: ["shell variable", "export", "environment", "PATH", "child process", "env"],
  stages: [
    {
      id: "local",
      title: "A shell variable is local",
      body: [
        "`greeting=\"hello\"` creates a variable inside the current shell process. You can read it with `$greeting`, but it exists nowhere else.",
        "No spaces around `=` — `greeting = \"hello\"` would try to run a command called `greeting` with arguments `=` and `\"hello\"`.",
      ],
      code: CODE,
      activeLines: [2, 3],
      scene: scene({
        shell: [
          { id: "greet", name: "greeting", value: "hello", exported: false, state: "active" },
        ],
        callout: { tone: "active", text: "Shell-local. No child process can see it." },
      }),
    },
    {
      id: "export",
      title: "export puts it in the environment",
      body: [
        "`export PATH=...` marks the variable as part of the environment. The shell copies the environment to every child process it starts.",
        "`PATH` and `EDITOR` are conventions — the shell and programs look for specific names. The mechanism is just key=value pairs attached to the process.",
      ],
      code: CODE,
      activeLines: [6, 7],
      scene: scene({
        shell: [
          { id: "greet2", name: "greeting", value: "hello", exported: false },
          { id: "path", name: "PATH", value: "/usr/bin:/bin", exported: true, state: "active" },
          { id: "editor", name: "EDITOR", value: "vim", exported: true, state: "active" },
        ],
        callout: { tone: "active", text: "Exported variables travel to child processes. Local variables do not." },
      }),
    },
    {
      id: "inherit",
      title: "Child sees exported, not local",
      body: [
        "`bash -c 'echo $EDITOR'` starts a child process. It inherits a copy of the environment — so it sees `EDITOR=vim`.",
        "`bash -c 'echo $greeting'` prints nothing. `greeting` was never exported, so it does not exist in the child's environment.",
      ],
      code: CODE,
      activeLines: [10, 11],
      scene: scene({
        shell: [
          { id: "greet3", name: "greeting", value: "hello", exported: false },
          { id: "path2", name: "PATH", value: "/usr/bin:/bin", exported: true },
          { id: "editor2", name: "EDITOR", value: "vim", exported: true },
        ],
        child: [
          { id: "c-editor", name: "EDITOR", value: "vim", state: "success" },
          { id: "c-greet", name: "greeting", value: "(empty)", state: "danger" },
        ],
        callout: { tone: "danger", text: "greeting is missing in the child. Only exported variables cross the process boundary." },
      }),
    },
    {
      id: "one-way",
      title: "Inheritance is one-way",
      body: [
        "The child gets a *copy* of the environment. If the child modifies `EDITOR`, the parent's value is unchanged. There is no connection after the fork.",
        "This is why `cd` in a script does not change your shell's directory — the script runs in a child process, and its working directory is its own copy.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        shell: [
          { id: "editor3", name: "EDITOR", value: "vim", exported: true, state: "success" },
        ],
        child: [
          { id: "c-editor2", name: "EDITOR", value: "nano", state: "read" },
        ],
        callout: { tone: "info", text: "Child changes its own copy. Parent is unaffected. No reverse channel." },
      }),
    },
    {
      id: "unset",
      title: "unset removes a variable",
      body: [
        "`unset greeting` removes the variable entirely — `$greeting` expands to an empty string after this.",
        "For environment variables, `unset` removes them from the current shell and from any future children. Existing children already have their copy.",
      ],
      code: CODE,
      activeLines: [17, 18],
      scene: scene({
        shell: [
          { id: "greet4", name: "greeting", value: "(removed)", exported: false, state: "freed" },
          { id: "path3", name: "PATH", value: "/usr/bin:/bin", exported: true },
          { id: "editor4", name: "EDITOR", value: "vim", exported: true },
        ],
        callout: {
          tone: "success",
          text: "Local = this shell only. Exported = copied to children. unset = gone.",
        },
      }),
    },
  ],
};
