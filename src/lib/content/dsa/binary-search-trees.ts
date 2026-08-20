import type { Arrow, GraphNode, Lesson, Scene } from "@/lib/viz/types";
import { nodeRegion } from "@/lib/viz/scene-helpers";

const CODE = `struct Node {
    int          key;
    struct Node *left, *right;
};

struct Node *insert(struct Node *root, int key) {
    if (root == NULL)
        return make_node(key);

    if (key < root->key)
        root->left  = insert(root->left, key);
    else if (key > root->key)
        root->right = insert(root->right, key);

    return root;                 /* equal: already present */
}

struct Node *search(struct Node *root, int key) {
    while (root != NULL) {
        if (key == root->key) return root;
        root = (key < root->key) ? root->left : root->right;
    }
    return NULL;
}`;

/** Layout is fixed across every stage so nodes never jump between steps. */
const POS: Record<string, { level: number; slot: number }> = {
  n50: { level: 0, slot: 3 },
  n30: { level: 1, slot: 1 },
  n70: { level: 1, slot: 5 },
  n20: { level: 2, slot: 0 },
  n40: { level: 2, slot: 2 },
  n60: { level: 2, slot: 4 },
  n80: { level: 2, slot: 6 },
};

const EDGES: [string, string][] = [
  ["n50", "n30"],
  ["n50", "n70"],
  ["n30", "n20"],
  ["n30", "n40"],
  ["n70", "n60"],
  ["n70", "n80"],
];

function scene(opts: {
  show: string[];
  states?: Record<string, GraphNode["state"]>;
  notes?: Record<string, string>;
  activePath?: [string, string][];
  caption?: string;
  callout?: Scene["callout"];
}): Scene {
  const visible = new Set(opts.show);

  const nodes: GraphNode[] = opts.show.map((id) => ({
    id,
    label: id.slice(1),
    level: POS[id].level,
    slot: POS[id].slot,
    state: opts.states?.[id] ?? "idle",
    note: opts.notes?.[id],
  }));

  const activeSet = new Set((opts.activePath ?? []).map(([a, b]) => `${a}->${b}`));

  const arrows: Arrow[] = EDGES.filter(
    ([from, to]) => visible.has(from) && visible.has(to),
  ).map(([from, to]) => ({
    id: `${from}->${to}`,
    from,
    to,
    state: activeSet.has(`${from}->${to}`) ? "active" : "idle",
  }));

  return {
    regions: [
      nodeRegion(
        "bst",
        "Binary search tree",
        nodes,
        opts.caption ?? "left subtree < node < right subtree",
      ),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const binarySearchTrees: Lesson = {
  slug: "binary-search-trees",
  track: "dsa",
  title: "Binary search trees",
  tagline: "One ordering rule turns searching into a sequence of yes/no decisions.",
  description:
    "Insert keys into a BST and watch each one walk down to its place, search in O(log n) by discarding a subtree per comparison, and see how sorted input degrades the tree into a linked list.",
  difficulty: 2,
  minutes: 11,
  access: "free",
  language: "c",
  keywords: ["binary search tree", "BST", "tree insertion", "tree search", "balanced tree"],
  stages: [
    {
      id: "root",
      title: "The first key becomes the root",
      body: [
        "An empty tree is a `NULL` pointer. Inserting 50 into it allocates one node with two null children.",
        "Everything that follows is governed by a single invariant: **every key in the left subtree is smaller than the node, and every key in the right subtree is larger**.",
      ],
      code: CODE,
      activeLines: [6, 7],
      scene: scene({
        show: ["n50"],
        states: { n50: "active" },
        callout: { tone: "active", text: "The invariant is what makes the tree searchable. Break it and it is just a tree." },
      }),
    },
    {
      id: "insert-30",
      title: "insert(30): smaller, so go left",
      body: [
        "30 is compared with 50. It is smaller, so it belongs somewhere in the left subtree. That subtree is empty, so 30 becomes the left child.",
        "Notice that insertion never moves an existing node. New keys always end up as a new leaf.",
      ],
      code: CODE,
      activeLines: [9, 10],
      scene: scene({
        show: ["n50", "n30"],
        states: { n50: "read", n30: "active" },
        activePath: [["n50", "n30"]],
        callout: { tone: "active", text: "30 < 50 → left. The left pointer was NULL, so this is where it stops." },
      }),
    },
    {
      id: "insert-70",
      title: "insert(70): larger, so go right",
      body: [
        "Same comparison, opposite branch. The tree now has a root and two children — a depth of 1.",
        "The recursive call in `insert` returns the subtree root, and the parent reassigns its pointer to it. That is why the function returns `root` in every path.",
      ],
      code: CODE,
      activeLines: [11, 12],
      scene: scene({
        show: ["n50", "n30", "n70"],
        states: { n50: "read", n70: "active" },
        activePath: [["n50", "n70"]],
        callout: { tone: "active", text: "70 > 50 → right. Two comparisons would now cover three keys." },
      }),
    },
    {
      id: "full",
      title: "Four more keys fill the level below",
      body: [
        "Inserting 20, 40, 60 and 80 gives a complete tree of depth 2. Each one took exactly two comparisons to find its place.",
        "Read the leaves left to right and you get 20, 30, 40, 50, 60, 70, 80 — an in-order traversal of a BST always produces sorted output. That is a free sort, and a useful sanity check.",
      ],
      code: CODE,
      activeLines: [9, 10, 11, 12],
      scene: scene({
        show: ["n50", "n30", "n70", "n20", "n40", "n60", "n80"],
        states: { n20: "read", n40: "read", n60: "read", n80: "read" },
        callout: {
          tone: "info",
          text: "7 nodes, depth 2. In-order traversal reads them out in sorted order.",
        },
      }),
    },
    {
      id: "search-1",
      title: "search(40): start at the root",
      body: [
        "40 is less than 50, so the entire right subtree — 70, 60, 80 — is eliminated without being looked at.",
        "This is the same halving as binary search on an array. The difference is that the structure, not arithmetic, decides where to go next.",
      ],
      code: CODE,
      activeLines: [20, 21, 22],
      scene: scene({
        show: ["n50", "n30", "n70", "n20", "n40", "n60", "n80"],
        states: { n50: "active", n70: "freed", n60: "freed", n80: "freed" },
        activePath: [["n50", "n30"]],
        callout: { tone: "active", text: "40 < 50 → left. Three nodes discarded on the first comparison." },
      }),
    },
    {
      id: "search-2",
      title: "40 is greater than 30, so go right",
      body: [
        "The live region is now just 30 and its two children. One more comparison discards 20.",
        "Each step down the tree costs one comparison and halves the remaining candidates — provided the tree is balanced.",
      ],
      code: CODE,
      activeLines: [22],
      scene: scene({
        show: ["n50", "n30", "n70", "n20", "n40", "n60", "n80"],
        states: { n50: "read", n30: "active", n70: "freed", n60: "freed", n80: "freed", n20: "freed" },
        activePath: [["n30", "n40"]],
        callout: { tone: "active", text: "40 > 30 → right. Only one candidate remains." },
      }),
    },
    {
      id: "search-found",
      title: "Found in three comparisons",
      body: [
        "50, then 30, then 40 — three comparisons to locate one key among seven.",
        "The cost of a search is the **depth** of the tree, not the number of nodes. A balanced tree of a million keys is about 20 deep.",
      ],
      code: CODE,
      activeLines: [21],
      scene: scene({
        show: ["n50", "n30", "n70", "n20", "n40", "n60", "n80"],
        states: { n50: "read", n30: "read", n40: "success", n70: "freed", n60: "freed", n80: "freed", n20: "freed" },
        callout: {
          tone: "success",
          text: "3 comparisons for 7 nodes. log₂(8) = 3 — the depth is the running time.",
        },
      }),
    },
    {
      id: "degenerate",
      title: "Insert in sorted order and it collapses",
      body: [
        "Insert 20, 30, 40, 50 in ascending order and every key is larger than the last, so every one becomes a right child. The tree becomes a single chain.",
        "Search is now O(n) — it is a linked list with extra pointers. Nothing about the BST rules was violated; the shape simply degenerated.",
      ],
      code: CODE,
      activeLines: [11, 12],
      scene: scene({
        show: ["n20", "n30", "n40", "n50"],
        states: { n20: "danger", n30: "danger", n40: "danger", n50: "danger" },
        notes: { n50: "depth 3" },
        callout: {
          tone: "danger",
          text: "Sorted input is the worst case, and it is a very common input. This is why self-balancing trees exist.",
        },
      }),
    },
    {
      id: "recap",
      title: "What you actually get",
      body: [
        "A BST gives O(log n) search, insert and delete **on average**, plus sorted iteration and range queries for free — things a hash table cannot do.",
        "But the guarantee is only average-case. Production containers like `std::map` and `TreeMap` use red-black trees, which rotate on insertion to keep the depth logarithmic no matter what order the keys arrive in.",
      ],
      code: CODE,
      activeLines: [19, 20, 21, 22, 23],
      scene: scene({
        show: ["n50", "n30", "n70", "n20", "n40", "n60", "n80"],
        states: { n50: "success" },
        callout: {
          tone: "success",
          text: "Balanced: depth ≈ log₂(n). Degenerate: depth = n. Balancing is what closes that gap.",
        },
      }),
    },
  ],
};
