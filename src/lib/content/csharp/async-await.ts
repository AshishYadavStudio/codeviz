import type { Frame, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `async Task<string> GetPageAsync(HttpClient http) {
    Console.WriteLine("before");          // runs on the caller's thread
    string body = await http.GetStringAsync(url);   // returns here
    Console.WriteLine("after");           // resumes later
    return body.Trim();
}

var task = GetPageAsync(http);   // starts it, does not wait
DoSomethingElse();               // runs while the request is in flight
string page = await task;        // now wait for the result

// Blocking anti-pattern:
string bad = GetPageAsync(http).Result;   // can deadlock`;

function scene(opts: {
  threadFrames: Frame[];
  machine?: { state: string; resume: string; captured: string[] };
  io?: { label: string; state: "pending" | "done" };
  callout?: Scene["callout"];
}): Scene {
  const regions = [stackRegion(opts.threadFrames, "the thread pool thread currently running")];

  if (opts.machine) {
    regions.push(
      blocksRegion(
        "machine",
        "State machine on the heap",
        [
          {
            id: "sm",
            label: "GetPageAsync state machine",
            state: "active",
            badge: `state ${opts.machine.state}`,
            cells: [
              { id: "sm-state", name: "state", value: opts.machine.state, state: "active", row: 0 },
              { id: "sm-resume", name: "resume at", value: opts.machine.resume, state: "read", row: 0 },
              ...opts.machine.captured.map((c, i) => ({
                id: `sm-cap-${i}`,
                name: "captured",
                value: c,
                state: "idle" as const,
                row: 1,
              })),
            ],
          },
        ],
        "your locals live here, not on the stack",
      ),
    );
  }

  if (opts.io) {
    regions.push(
      blocksRegion("io", "In flight", [
        {
          id: "req",
          label: opts.io.label,
          state: opts.io.state === "done" ? "returning" : "active",
          badge: opts.io.state === "done" ? "completed" : "no thread is waiting on this",
          cells: [
            {
              id: "req-v",
              name: "result",
              value: opts.io.state === "done" ? '"<html>…"' : "pending",
              state: opts.io.state === "done" ? "success" : "garbage",
              row: 0,
            },
          ],
        },
      ]),
    );
  }

  return { regions, callout: opts.callout };
}

const thread = (label: string, running: string, state: Frame["state"] = "active"): Frame => ({
  id: "thread",
  label,
  state,
  cells: [{ id: "t-run", name: "running", value: running, state: "active", row: 0 }],
});

export const asyncAwait: Lesson = {
  slug: "async-await",
  track: "csharp",
  title: "async / await",
  tagline: "await does not wait. It returns, and arranges to be called back.",
  description:
    "Watch a method suspend at an await, hand its thread back, keep its locals alive in a heap state machine, and resume where it left off when the I/O completes.",
  difficulty: 3,
  minutes: 11,
  access: "free",
  language: "csharp",
  filename: "Program.cs",
  keywords: ["async await", "Task", "state machine", "deadlock", "ConfigureAwait", "asynchronous c#"],
  stages: [
    {
      id: "sync-start",
      title: "An async method starts synchronously",
      body: [
        "Calling `GetPageAsync` does not schedule anything on another thread. The body begins running immediately, on the caller's thread, and `\"before\"` is printed right away.",
        "`async` is not a synonym for \"on a background thread\". Nothing is parallel yet.",
      ],
      code: CODE,
      activeLines: [1, 2],
      scene: scene({
        threadFrames: [thread("Thread #1", "GetPageAsync")],
        callout: { tone: "active", text: "Everything up to the first await runs like an ordinary method call." },
      }),
    },
    {
      id: "await",
      title: "At the await, the method returns",
      body: [
        "`http.GetStringAsync` starts the request and hands back an incomplete `Task`. Because that task is not finished, the `await` **returns from `GetPageAsync` entirely**, giving back an incomplete `Task<string>` of its own.",
        "The thread is now free. It goes back to the pool and does other work — that is the whole point.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        threadFrames: [thread("Thread #1", "the caller, again", "returning")],
        machine: { state: "0", resume: "line 4", captured: ["http", "url"] },
        io: { label: "HTTP GET", state: "pending" },
        callout: {
          tone: "active",
          text: "No thread is blocked on the network. Scaling comes from threads not sitting idle.",
        },
      }),
    },
    {
      id: "state-machine",
      title: "Your locals moved to the heap",
      body: [
        "A stack frame cannot survive a method returning, so the compiler rewrote this method as a state machine object. It stores which `await` to resume at, plus every local that is still needed afterwards.",
        "That is why an async method allocates, and why capturing large objects in a long-lived async method keeps them alive.",
      ],
      code: CODE,
      activeLines: [1, 5],
      scene: scene({
        threadFrames: [thread("Thread #1", "unrelated work")],
        machine: { state: "0", resume: "line 4", captured: ["body (not yet set)", "http"] },
        io: { label: "HTTP GET", state: "pending" },
        callout: { tone: "info", text: "async/await is a compiler transformation, not a runtime thread trick." },
      }),
    },
    {
      id: "meanwhile",
      title: "The caller keeps going",
      body: [
        "Back at the call site, `var task = GetPageAsync(http)` completed almost instantly with an unfinished task. `DoSomethingElse()` runs while the HTTP request is still travelling.",
        "This is where concurrency actually comes from: starting the task and awaiting it *later*, rather than on the same line.",
      ],
      code: CODE,
      activeLines: [8, 9],
      scene: scene({
        threadFrames: [thread("Thread #1", "DoSomethingElse()")],
        machine: { state: "0", resume: "line 4", captured: ["http"] },
        io: { label: "HTTP GET", state: "pending" },
        callout: { tone: "active", text: "Await as late as you can. Awaiting immediately gives up the overlap." },
      }),
    },
    {
      id: "resume",
      title: "Completion schedules the continuation",
      body: [
        "When the response arrives, the awaited task completes and the state machine is scheduled to continue — quite possibly on a *different* thread from the one that started it.",
        "The method picks up at line 4 with `body` filled in, exactly as if it had never paused.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        threadFrames: [thread("Thread #7", "GetPageAsync (resumed)")],
        machine: { state: "1", resume: "line 5", captured: ['body = "<html>…"'] },
        io: { label: "HTTP GET", state: "done" },
        callout: {
          tone: "success",
          text: "Different thread, same logical method. Never assume thread affinity across an await.",
        },
      }),
    },
    {
      id: "complete",
      title: "return sets the task's result",
      body: [
        "`return body.Trim()` does not return to a caller in the usual sense — the caller left long ago. It completes the `Task<string>` the method handed out at the first `await`.",
        "Anyone awaiting that task is now scheduled to continue in turn.",
      ],
      code: CODE,
      activeLines: [5, 10],
      scene: scene({
        threadFrames: [thread("Thread #7", "caller resumes with the string", "returning")],
        io: { label: "HTTP GET", state: "done" },
        callout: { tone: "success", text: "A Task is a promise of a future value, plus a list of who to notify." },
      }),
    },
    {
      id: "deadlock",
      title: ".Result and .Wait() can deadlock",
      body: [
        "Blocking on a task holds the current thread while waiting for a continuation that may need that very thread to run — classically the UI thread in older frameworks, which has a single-threaded synchronization context.",
        "The result is a deadlock that does not reproduce under load testing on a server and appears instantly on a desktop app.",
        "The fix is to stay async the whole way up: await it. Use `ConfigureAwait(false)` in library code so the continuation does not insist on the original context.",
      ],
      code: CODE,
      activeLines: [12, 13],
      scene: scene({
        threadFrames: [
          {
            id: "thread",
            label: "Thread #1",
            state: "idle",
            cells: [
              { id: "t-run", name: "blocked in", value: ".Result", state: "danger", row: 0 },
              { id: "t-need", name: "waiting for", value: "a continuation that needs this thread", state: "danger", row: 0 },
            ],
          },
        ],
        io: { label: "HTTP GET", state: "done" },
        callout: {
          tone: "danger",
          text: "async all the way down. Mixing blocking and async is where the hard bugs live.",
        },
      }),
    },
  ],
};
