import type { Arrow, GraphNode, Lesson, Scene } from "@/lib/viz/types";
import { nodeRegion } from "@/lib/viz/scene-helpers";

const CODE = `struct Node {
    int          value;
    struct Node *next;
};

struct Node *head = NULL;

/* insert at the front — O(1) */
struct Node *push_front(struct Node *head, int value) {
    struct Node *node = malloc(sizeof *node);
    node->value = value;
    node->next  = head;
    return node;
}

/* find a value — O(n) */
struct Node *find(struct Node *head, int target) {
    for (struct Node *p = head; p != NULL; p = p->next)
        if (p->value == target)
            return p;
    return NULL;
}`;

interface NodeSpec {
  id: string;
  value: string;
  slot: number;
  state?: GraphNode["state"];
  note?: string;
}

function scene(opts: {
  nodes: NodeSpec[];
  /** Edges as [fromId, toId] pairs. */
  edges: [string, string][];
  activeEdge?: string;
  danglingEdge?: [string, string];
  caption?: string;
  callout?: Scene["callout"];
}): Scene {
  const nodes: GraphNode[] = opts.nodes.map((n) => ({
    id: n.id,
    label: n.value,
    level: 0,
    slot: n.slot,
    shape: "box",
    state: n.state ?? "idle",
    note: n.note,
  }));

  const arrows: Arrow[] = opts.edges.map(([from, to]) => ({
    id: `${from}->${to}`,
    from,
    to,
    state: `${from}->${to}` === opts.activeEdge ? "active" : "idle",
  }));

  if (opts.danglingEdge) {
    const [from, to] = opts.danglingEdge;
    arrows.push({ id: `dangling-${from}`, from, to, state: "danger", dashed: true });
  }

  return {
    regions: [nodeRegion("list", "Heap", nodes, opts.caption ?? "nodes are not adjacent in memory")],
    arrows,
    callout: opts.callout,
  };
}

const NODE = (id: string, value: string, slot: number, extra: Partial<NodeSpec> = {}): NodeSpec => ({
  id,
  value,
  slot,
  ...extra,
});

export const linkedList: Lesson = {
  slug: "linked-list",
  track: "dsa",
  title: "Singly linked lists",
  tagline: "Every node knows only the next one. Everything the structure can and cannot do follows from that.",
  description:
    "Build a linked list node by node, insert at the front in constant time, walk it to find a value, and see exactly which pointer to reassign when deleting.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "c",
  keywords: ["linked list", "nodes and pointers", "insertion", "traversal", "deletion"],
  intro: [
    "A **linked list** is the opposite trade-off from an array. Instead of one block of memory, it is a chain of **nodes** scattered across the heap — each node holds a value plus a pointer to the next node.",
    "That indirection is the whole story. You can insert or delete a node in the middle without moving anything else (just re-wire the pointers). But to reach the 500th element, you have to walk from the start, one pointer at a time.",
    "This lesson watches nodes get allocated on the heap, linked together, spliced apart, and shows the classic bug — leaving a dangling pointer to a freed node.",
  ],
  stages: [
    {
      id: "node",
      title: "A node is a value and a next pointer",
      body: [
        "Each node holds its data and the address of the node after it. There is no array, no block of contiguous memory — each node was allocated separately and could be anywhere on the heap.",
        "The `head` pointer is the only way in. Lose it and the entire list is unreachable.",
      ],
      code: CODE,
      activeLines: [1, 2, 3, 4],
      scene: scene({
        nodes: [NODE("head", "head", 0, { state: "read", note: "entry point" })],
        edges: [],
        callout: { tone: "info", text: "head is NULL — an empty list is just a pointer to nothing." },
      }),
    },
    {
      id: "first",
      title: "push_front(3): allocate and point at the old head",
      body: [
        "The new node's `next` is set to whatever `head` was — `NULL` here — and the new node becomes the head.",
        "No existing node was touched. That is why front insertion is O(1) regardless of how long the list already is.",
      ],
      code: CODE,
      activeLines: [11, 12, 13, 14],
      scene: scene({
        nodes: [
          NODE("head", "head", 0, { state: "read" }),
          NODE("n3", "3", 1.6, { state: "active", note: "next = NULL" }),
        ],
        edges: [["head", "n3"]],
        activeEdge: "head->n3",
        callout: { tone: "active", text: "One allocation, two pointer writes. Nothing else moved." },
      }),
    },
    {
      id: "second",
      title: "push_front(8): the new node goes in front",
      body: [
        "`node->next = head` links the new node to the existing list before `head` is reassigned. The order matters — reassign `head` first and you lose the reference to node 3 permanently.",
        "Compare this with an array, where inserting at the front means shifting every element right.",
      ],
      code: CODE,
      activeLines: [13, 14],
      scene: scene({
        nodes: [
          NODE("head", "head", 0, { state: "read" }),
          NODE("n8", "8", 1.6, { state: "active" }),
          NODE("n3", "3", 3.2),
        ],
        edges: [
          ["head", "n8"],
          ["n8", "n3"],
        ],
        activeEdge: "head->n8",
        callout: {
          tone: "active",
          text: "Array front-insert is O(n) because everything shifts. Here nothing shifts.",
        },
      }),
    },
    {
      id: "third",
      title: "The list grows leftward",
      body: [
        "After `push_front(5)` the list reads 5 → 8 → 3. Inserting at the front reverses the order things were added in.",
        "The last node's `next` is `NULL`, which is what every traversal uses as its stopping condition.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        nodes: [
          NODE("head", "head", 0, { state: "read" }),
          NODE("n5", "5", 1.6, { state: "active" }),
          NODE("n8", "8", 3.2),
          NODE("n3", "3", 4.8, { note: "next = NULL" }),
        ],
        edges: [
          ["head", "n5"],
          ["n5", "n8"],
          ["n8", "n3"],
        ],
        activeEdge: "head->n5",
        callout: { tone: "info", text: "Three nodes, three separate allocations, possibly far apart in memory." },
      }),
    },
    {
      id: "traverse",
      title: "Finding a value means walking from the head",
      body: [
        "There is no indexing. To reach the third node you must visit the first and second, because only they know where the next one is.",
        "That is the trade: O(1) insertion at the front, but O(n) access to anything — the exact opposite of an array.",
      ],
      code: CODE,
      activeLines: [19, 20, 21],
      scene: scene({
        nodes: [
          NODE("head", "head", 0),
          NODE("n5", "5", 1.6, { state: "read", note: "p" }),
          NODE("n8", "8", 3.2),
          NODE("n3", "3", 4.8),
        ],
        edges: [
          ["head", "n5"],
          ["n5", "n8"],
          ["n8", "n3"],
        ],
        activeEdge: "n5->n8",
        callout: { tone: "active", text: "p = head. Not the target, so follow p->next." },
      }),
    },
    {
      id: "traverse-2",
      title: "Two hops to reach node 3",
      body: [
        "Each step costs a pointer dereference, and each dereference is likely a cache miss — the nodes are scattered, so the CPU cannot prefetch the next one.",
        "This is why an array of the same data is usually faster to scan in practice, even though both are O(n) on paper.",
      ],
      code: CODE,
      activeLines: [20, 21, 22],
      scene: scene({
        nodes: [
          NODE("head", "head", 0),
          NODE("n5", "5", 1.6),
          NODE("n8", "8", 3.2),
          NODE("n3", "3", 4.8, { state: "success", note: "p — found" }),
        ],
        edges: [
          ["head", "n5"],
          ["n5", "n8"],
          ["n8", "n3"],
        ],
        callout: {
          tone: "success",
          text: "Found after 3 visits. Big-O is equal to an array scan; cache behaviour is not.",
        },
      }),
    },
    {
      id: "delete",
      title: "Deleting means re-pointing the node before it",
      body: [
        "To remove node 8, the node *before* it must be told to skip it: `prev->next = node->next`. A singly linked node cannot remove itself, because it has no way to reach its predecessor.",
        "This is precisely the problem a doubly linked list solves, at the cost of one extra pointer per node.",
      ],
      code: CODE,
      activeLines: [20],
      scene: scene({
        nodes: [
          NODE("head", "head", 0),
          NODE("n5", "5", 1.6, { state: "active", note: "prev" }),
          NODE("n8", "8", 3.2, { state: "danger", note: "unlinking" }),
          NODE("n3", "3", 4.8),
        ],
        edges: [
          ["head", "n5"],
          ["n5", "n3"],
        ],
        activeEdge: "n5->n3",
        danglingEdge: ["n8", "n3"],
        callout: {
          tone: "danger",
          text: "Node 8 is now unreachable — but still allocated. Forget the free() and it is a leak.",
        },
      }),
    },
    {
      id: "recap",
      title: "What linked lists are actually for",
      body: [
        "Use one when you insert and remove constantly at known positions, and rarely index — queues, free lists, adjacency lists, and the chains inside a hash table.",
        "Use an array when you scan or index often. In modern code that is most of the time, which is why `std::vector` and `ArrayList` are the defaults and linked lists are the special case.",
      ],
      code: CODE,
      activeLines: [11, 19],
      scene: scene({
        nodes: [
          NODE("head", "head", 0),
          NODE("n5", "5", 1.6),
          NODE("n3", "3", 3.2, { note: "next = NULL" }),
        ],
        edges: [
          ["head", "n5"],
          ["n5", "n3"],
        ],
        callout: {
          tone: "success",
          text: "O(1) insert at a known position · O(n) to find that position · no contiguous memory required.",
        },
      }),
    },
  ],
};
