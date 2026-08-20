import type { Frame, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `ps -f                    # PID, PPID, command

sleep 60 &               # run in the background
jobs                     # shells track background jobs
kill %1                  # polite: SIGTERM

kill -9 1234             # SIGKILL — cannot be caught
kill -STOP 1234          # pause
kill -CONT 1234          # resume

# a shell running a command:
#   fork()  -> a copy of the shell
#   exec()  -> that copy becomes the new program
#   wait()  -> the shell waits for it to exit`;

function proc(
  id: string,
  label: string,
  opts: {
    pid: string;
    ppid: string;
    state: string;
    frameState?: Frame["state"];
    cellState?: "idle" | "active" | "read" | "success" | "danger" | "freed";
    note?: string;
  },
): Frame {
  return {
    id,
    label,
    state: opts.frameState ?? "active",
    badge: opts.state,
    note: opts.note,
    cells: [
      { id: `${id}-pid`, name: "PID", value: opts.pid, state: opts.cellState ?? "idle", row: 0 },
      { id: `${id}-ppid`, name: "PPID", value: opts.ppid, state: "idle", row: 0 },
    ],
  };
}

const scene = (frames: Frame[], callout?: Scene["callout"], caption?: string): Scene => ({
  regions: [blocksRegion("procs", "Processes", frames, caption ?? "every process has a parent")],
  callout,
});

export const processesAndFork: Lesson = {
  slug: "processes-and-signals",
  track: "linux",
  title: "Processes, fork & signals",
  tagline: "Running a command means copying a process, then replacing what it is running.",
  description:
    "Follow fork, exec and wait as a shell launches a command, then see what background jobs, SIGTERM, SIGKILL and zombie processes actually are.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "bash",
  filename: "session.sh",
  keywords: ["fork", "exec", "process", "PID", "signals", "SIGKILL", "zombie process", "background jobs"],
  stages: [
    {
      id: "shell",
      title: "Your shell is just a process",
      body: [
        "It has a process ID, and a parent process ID pointing at whatever started it — a terminal emulator or a login process.",
        "Every process except the very first has a parent, which makes the whole system a tree rooted at PID 1.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene(
        [proc("bash", "bash", { pid: "2041", ppid: "1990", state: "running", cellState: "active" })],
        { tone: "info", text: "ps -f shows this relationship: PID, PPID, and the command." },
      ),
    },
    {
      id: "fork",
      title: "fork() duplicates the process",
      body: [
        "To run a command, the shell first calls `fork`, which creates a near-identical copy of itself — same code, same open files, same variables, different PID.",
        "For a moment two shells exist. The child's parent ID is the original shell's PID, and `fork` returns 0 in the child but the child's PID in the parent, which is how each knows which one it is.",
      ],
      code: CODE,
      activeLines: [12, 13],
      scene: scene(
        [
          proc("bash", "bash", { pid: "2041", ppid: "1990", state: "running" }),
          proc("child", "bash (copy)", {
            pid: "2077",
            ppid: "2041",
            state: "just forked",
            cellState: "active",
            note: "identical to its parent, for now",
          }),
        ],
        { tone: "active", text: "Copying is cheap: pages are shared until one side writes to them." },
      ),
    },
    {
      id: "exec",
      title: "exec() replaces the program",
      body: [
        "The child immediately calls `exec`, which throws away its own program and loads the new one in its place. The PID does not change — the process is the same, the code inside it is not.",
        "This split is why the shell can arrange redirections between `fork` and `exec`: it sets up the file descriptors while it is still itself, and the new program inherits them.",
      ],
      code: CODE,
      activeLines: [13, 14],
      scene: scene(
        [
          proc("bash", "bash", { pid: "2041", ppid: "1990", state: "waiting", frameState: "idle" }),
          proc("child", "sleep 60", {
            pid: "2077",
            ppid: "2041",
            state: "running",
            cellState: "active",
            note: "same PID, entirely different program",
          }),
        ],
        { tone: "active", text: "fork then exec. Almost every program you run in Linux starts this way." },
      ),
    },
    {
      id: "wait",
      title: "wait() is why your prompt pauses",
      body: [
        "In the foreground, the shell calls `wait` and blocks until the child exits, then collects its exit status — the value `$?` reports.",
        "Nothing mysterious is happening when the prompt does not come back: the shell is deliberately asleep.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene(
        [
          proc("bash", "bash", { pid: "2041", ppid: "1990", state: "blocked in wait()", frameState: "idle" }),
          proc("child", "sleep 60", { pid: "2077", ppid: "2041", state: "running", cellState: "read" }),
        ],
        { tone: "info", text: "The exit status travels back to the parent. That is the only value a process returns." },
      ),
    },
    {
      id: "background",
      title: "& skips the wait",
      body: [
        "`sleep 60 &` does the same fork and exec, but the shell does not call `wait`. You get the prompt back immediately and the child keeps running.",
        "The shell still remembers it as a *job*, which is why `jobs` lists it and `%1` refers to it.",
      ],
      code: CODE,
      activeLines: [3, 4],
      scene: scene(
        [
          proc("bash", "bash", { pid: "2041", ppid: "1990", state: "prompt returned", cellState: "success" }),
          proc("child", "sleep 60", { pid: "2077", ppid: "2041", state: "running in background", cellState: "read" }),
        ],
        { tone: "active", text: "Jobs are a shell concept. PIDs are a kernel concept. kill takes either, with %1 vs 2077." },
      ),
    },
    {
      id: "signals",
      title: "kill sends a signal — it does not necessarily kill",
      body: [
        "`kill` delivers a signal, and the default is `SIGTERM` (15): a polite request to shut down. A well-behaved program catches it, flushes its files, and exits.",
        "`SIGSTOP` pauses a process and `SIGCONT` resumes it — that is exactly what Ctrl-Z and `fg` do. Ctrl-C sends `SIGINT`.",
      ],
      code: CODE,
      activeLines: [5, 8, 9],
      scene: scene(
        [
          proc("child", "sleep 60", {
            pid: "2077",
            ppid: "2041",
            state: "SIGTERM received",
            cellState: "active",
            note: "given the chance to clean up",
          }),
        ],
        { tone: "active", text: "The name is misleading. Most signals are messages, not executions." },
      ),
    },
    {
      id: "sigkill",
      title: "SIGKILL is the one that cannot be argued with",
      body: [
        "`kill -9` sends `SIGKILL`, which the process is not permitted to catch, block or ignore. The kernel removes it immediately.",
        "That means no cleanup: temporary files stay, buffers are lost, locks are left behind. Always try the default `SIGTERM` first; `-9` is for processes that have stopped responding.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene(
        [
          proc("child", "sleep 60", {
            pid: "2077",
            ppid: "2041",
            state: "killed",
            frameState: "popped",
            cellState: "freed",
            note: "no chance to save anything",
          }),
        ],
        { tone: "danger", text: "SIGKILL and SIGSTOP are the only two signals a process cannot handle." },
      ),
    },
    {
      id: "zombies",
      title: "Zombies and orphans",
      body: [
        "When a process exits, its entry stays in the table until the parent calls `wait` to read the exit status. Until then it is a **zombie** — dead, holding no memory, but still occupying a PID.",
        "A pile of zombies means a parent that is not reaping its children. Killing the zombie does nothing; you have to fix or restart the parent.",
        "The opposite case is an **orphan**: a child whose parent exits first. It is adopted by PID 1, which reaps it correctly. That is how background processes keep running after you close the terminal.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene(
        [
          proc("bash", "bash", { pid: "2041", ppid: "1990", state: "never called wait()", frameState: "idle" }),
          proc("child", "sleep (exited)", {
            pid: "2077",
            ppid: "2041",
            state: "zombie",
            frameState: "popped",
            cellState: "danger",
            note: "exit status not yet collected",
          }),
        ],
        {
          tone: "success",
          text: "fork, exec, wait — three calls that explain process trees, job control, and both kinds of stray process.",
        },
        "a process that has exited but not been reaped",
      ),
    },
  ],
};
