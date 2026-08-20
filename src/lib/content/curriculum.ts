import type { TrackId } from "@/lib/viz/types";

/**
 * The complete curriculum — every concept each track covers, in teaching order,
 * grouped into modules.
 *
 * This is the syllabus, not the inventory. An entry here describes a concept
 * whether or not a lesson has been authored for it yet; `src/lib/content/<track>`
 * holds the lessons, and they are matched to entries by `slug`. That makes the
 * intended path visible to learners from day one, and makes the remaining work
 * explicit rather than implied.
 *
 * When you author a lesson, give it the slug used here and it becomes playable
 * automatically. Nothing else needs updating.
 */

export interface CurriculumEntry {
  /** Route slug. Authoring a lesson with this slug makes the entry live. */
  slug: string;
  title: string;
  /** One line on what the concept actually teaches. */
  tagline: string;
  difficulty: 1 | 2 | 3;
}

export interface CurriculumModule {
  name: string;
  summary: string;
  entries: CurriculumEntry[];
}

const c: CurriculumModule[] = [
  {
    name: "Foundations",
    summary: "What a variable is, and what the machine sees instead.",
    entries: [
      { slug: "variables-and-memory", title: "Variables & memory addresses", tagline: "A name you gave to a box the machine knows by number.", difficulty: 1 },
      { slug: "data-types-and-sizes", title: "Data types & sizes", tagline: "Why int is 4 bytes, what sizeof really asks, and integer overflow.", difficulty: 1 },
      { slug: "operators-and-precedence", title: "Operators & precedence", tagline: "Evaluation order, integer division, and the traps in ++i vs i++.", difficulty: 1 },
      { slug: "control-flow", title: "Control flow", tagline: "if, loops and switch as jumps — including fallthrough and off-by-one.", difficulty: 1 },
      { slug: "functions-and-scope", title: "Functions & scope", tagline: "Parameters are copies; locals, globals and static all live differently.", difficulty: 1 },
    ],
  },
  {
    name: "Pointers",
    summary: "The idea the whole language is built on.",
    entries: [
      { slug: "pointers-101", title: "Pointers 101", tagline: "An ordinary variable whose value happens to be an address.", difficulty: 1 },
      { slug: "pointer-arithmetic", title: "Pointer arithmetic", tagline: "p + 1 adds one element, and the type decides how big that is.", difficulty: 2 },
      { slug: "arrays-vs-pointers", title: "Arrays vs pointers", tagline: "Alike in every expression until sizeof tells the truth.", difficulty: 2 },
      { slug: "pointers-to-pointers", title: "Pointers to pointers", tagline: "Why char **argv works, and how to modify a caller's pointer.", difficulty: 2 },
      { slug: "const-and-pointers", title: "const & pointers", tagline: "Reading the declaration right to left: const pointer vs pointer to const.", difficulty: 2 },
      { slug: "void-pointers", title: "void pointers & generic code", tagline: "Type erasure in C, and how qsort takes any array.", difficulty: 3 },
    ],
  },
  {
    name: "Memory & lifetime",
    summary: "Where things live, and for how long.",
    entries: [
      { slug: "function-call-stack", title: "The function call stack", tagline: "Every call pushes a frame; every return pops one.", difficulty: 2 },
      { slug: "recursion-and-the-stack", title: "Recursion on the stack", tagline: "A function calling itself gets a new frame, like any other call.", difficulty: 2 },
      { slug: "dynamic-memory", title: "Dynamic memory: malloc & free", tagline: "Memory that outlives the frame, and never cleans up after you.", difficulty: 3 },
      { slug: "program-memory-layout", title: "A program's memory layout", tagline: "Text, data, bss, heap and stack — and which way each one grows.", difficulty: 2 },
      { slug: "memory-bugs", title: "Leaks, overflows & sanitizers", tagline: "The five classic memory bugs and the tools that find them.", difficulty: 3 },
    ],
  },
  {
    name: "Composite data",
    summary: "Building types out of other types.",
    entries: [
      { slug: "structs-and-padding", title: "Structs & memory layout", tagline: "Bigger than the sum of its fields, and field order decides by how much.", difficulty: 3 },
      { slug: "unions-and-enums", title: "Unions & enums", tagline: "One block of memory read several ways, and named integer constants.", difficulty: 2 },
      { slug: "typedef-and-opaque-types", title: "typedef & opaque types", tagline: "Naming types, and hiding a struct's contents behind a header.", difficulty: 2 },
      { slug: "linked-lists", title: "Linked lists", tagline: "Nodes scattered across the heap, stitched together by pointers.", difficulty: 3 },
      { slug: "multidimensional-arrays", title: "2D arrays & matrices", tagline: "Row-major layout, and why arr[i][j] is one address calculation.", difficulty: 2 },
    ],
  },
  {
    name: "Strings & I/O",
    summary: "Text is bytes, and files are streams.",
    entries: [
      { slug: "strings-in-memory", title: "Strings in memory", tagline: "No string type — just bytes and an agreement about where they stop.", difficulty: 3 },
      { slug: "string-functions", title: "The string library", tagline: "strlen, strcpy, strcmp and the bounded versions you should prefer.", difficulty: 2 },
      { slug: "formatted-io", title: "printf & scanf", tagline: "Format specifiers, and why scanf is where input bugs come from.", difficulty: 2 },
      { slug: "file-io", title: "File I/O", tagline: "fopen, buffering, EOF, and why your output appears late.", difficulty: 2 },
    ],
  },
  {
    name: "Systems & tooling",
    summary: "How C becomes a program.",
    entries: [
      { slug: "bitwise-operations", title: "Bitwise operations", tagline: "Eight switches in a byte, flipped in parallel.", difficulty: 2 },
      { slug: "preprocessor-and-macros", title: "The preprocessor", tagline: "Textual substitution before compilation, and why macros need parentheses.", difficulty: 2 },
      { slug: "function-pointers", title: "Function pointers", tagline: "Storing code addresses — callbacks, dispatch tables and qsort.", difficulty: 3 },
      { slug: "compilation-and-linking", title: "Compilation & linking", tagline: "Preprocess, compile, assemble, link — and where each error comes from.", difficulty: 2 },
      { slug: "undefined-behaviour", title: "Undefined behaviour", tagline: "Why it works on your machine, and why the optimiser deletes your check.", difficulty: 3 },
    ],
  },
];

const cpp: CurriculumModule[] = [
  {
    name: "Beyond C",
    summary: "What C++ adds before you touch a class.",
    entries: [
      { slug: "references-vs-pointers", title: "References vs pointers", tagline: "A pointer is a box holding an address. A reference is not a box.", difficulty: 1 },
      { slug: "auto-and-type-deduction", title: "auto & type deduction", tagline: "What auto actually deduces, and when it drops const and references.", difficulty: 2 },
      { slug: "namespaces", title: "Namespaces", tagline: "Scoping names, and why using namespace std belongs in no header.", difficulty: 1 },
      { slug: "overloading-and-defaults", title: "Overloading & default arguments", tagline: "How the compiler picks between candidates, and when it refuses.", difficulty: 2 },
    ],
  },
  {
    name: "Objects",
    summary: "Classes as memory with rules attached.",
    entries: [
      { slug: "class-layout", title: "Class layout & this", tagline: "Members laid out like a struct; methods take a hidden this pointer.", difficulty: 2 },
      { slug: "raii-and-lifetime", title: "RAII: constructors & destructors", tagline: "The closing brace is the cleanup code.", difficulty: 2 },
      { slug: "member-initialisation", title: "Member initialisation", tagline: "Init lists vs assignment, and why declaration order wins.", difficulty: 2 },
      { slug: "static-members", title: "static members & lifetime", tagline: "One copy per class, initialised once, destroyed last.", difficulty: 2 },
    ],
  },
  {
    name: "Value semantics",
    summary: "What happens when an object is copied.",
    entries: [
      { slug: "copy-vs-move", title: "Copy vs move semantics", tagline: "A copy duplicates the data. A move changes who owns it.", difficulty: 2 },
      { slug: "rule-of-five", title: "The rule of five", tagline: "If you write one of them, you probably need all five.", difficulty: 3 },
      { slug: "operator-overloading", title: "Operator overloading", tagline: "Giving your type built-in syntax, and when that is a mistake.", difficulty: 2 },
    ],
  },
  {
    name: "Memory & ownership",
    summary: "Who deletes what, and when.",
    entries: [
      { slug: "new-and-delete", title: "new & delete", tagline: "Manual heap allocation, and why you should rarely write it.", difficulty: 2 },
      { slug: "smart-pointers", title: "unique_ptr & shared_ptr", tagline: "Ownership written into the type, enforced by the compiler.", difficulty: 2 },
      { slug: "weak-ptr-and-cycles", title: "weak_ptr & reference cycles", tagline: "Two shared_ptrs pointing at each other never reach zero.", difficulty: 3 },
    ],
  },
  {
    name: "Containers & the STL",
    summary: "What the standard library is doing underneath.",
    entries: [
      { slug: "vector-growth", title: "How std::vector grows", tagline: "Contiguous, dynamic, and occasionally it moves everything.", difficulty: 2 },
      { slug: "string-sso", title: "std::string & small-string optimisation", tagline: "Short strings live inside the object; long ones do not.", difficulty: 2 },
      { slug: "map-vs-unordered-map", title: "map vs unordered_map", tagline: "A balanced tree against a hash table — ordering versus speed.", difficulty: 2 },
      { slug: "iterators", title: "Iterators & ranges", tagline: "A generalised pointer, and the invalidation rules that bite.", difficulty: 2 },
    ],
  },
  {
    name: "Polymorphism",
    summary: "One interface, many implementations.",
    entries: [
      { slug: "inheritance-layout", title: "Inheritance & object layout", tagline: "The base class sits at the front of the derived object.", difficulty: 2 },
      { slug: "virtual-functions", title: "Virtual functions & the vtable", tagline: "The object carries a hidden pointer that decides which function runs.", difficulty: 3 },
      { slug: "abstract-classes", title: "Abstract classes & interfaces", tagline: "Pure virtual functions, and designing to an interface.", difficulty: 2 },
    ],
  },
  {
    name: "Templates & generics",
    summary: "Code written once, compiled per type.",
    entries: [
      { slug: "templates", title: "Templates & instantiation", tagline: "One template, one generated function per type you use.", difficulty: 3 },
      { slug: "template-specialisation", title: "Specialisation", tagline: "Overriding the generic version for a specific type.", difficulty: 3 },
      { slug: "concepts", title: "Concepts & constraints", tagline: "Saying what a template requires, and getting readable errors.", difficulty: 3 },
    ],
  },
  {
    name: "Errors & modern C++",
    summary: "Failure handling and the features that changed the style.",
    entries: [
      { slug: "exceptions", title: "Exceptions & stack unwinding", tagline: "Every destructor between throw and catch runs, in order.", difficulty: 3 },
      { slug: "lambdas-and-captures", title: "Lambdas & captures", tagline: "A generated class with the captured variables as members.", difficulty: 2 },
      { slug: "structured-bindings", title: "Structured bindings & std::optional", tagline: "Unpacking values, and representing absence without a sentinel.", difficulty: 2 },
    ],
  },
];

const java: CurriculumModule[] = [
  {
    name: "Foundations",
    summary: "Values, references, and the split that explains everything.",
    entries: [
      { slug: "references-and-objects", title: "References vs objects", tagline: "The variable is never the object — it is a handle.", difficulty: 1 },
      { slug: "primitives-and-wrappers", title: "Primitives & wrappers", tagline: "Eight types that hold values, and their object counterparts.", difficulty: 1 },
      { slug: "autoboxing", title: "Autoboxing & the Integer cache", tagline: "Why Integer 127 == 127 but 128 == 128 is false.", difficulty: 2 },
      { slug: "string-pool", title: "The string pool & ==", tagline: "Two strings that print the same can be two different objects.", difficulty: 1 },
      { slug: "stringbuilder", title: "StringBuilder & concatenation", tagline: "Why building a string in a loop with + allocates every iteration.", difficulty: 1 },
    ],
  },
  {
    name: "Object orientation",
    summary: "Classes, inheritance and dispatch.",
    entries: [
      { slug: "classes-and-instances", title: "Classes & instances", tagline: "Fields per object, methods shared, constructors chained.", difficulty: 1 },
      { slug: "inheritance-and-dispatch", title: "Inheritance & method dispatch", tagline: "The object's runtime class picks the method, not the variable's type.", difficulty: 2 },
      { slug: "interfaces", title: "Interfaces & default methods", tagline: "Multiple inheritance of behaviour without multiple inheritance of state.", difficulty: 2 },
      { slug: "equals-and-hashcode", title: "equals & hashCode", tagline: "The contract, and what breaks in collections when you violate it.", difficulty: 2 },
      { slug: "records-and-immutability", title: "Records & immutability", tagline: "Value-like classes, and why immutable objects are easier everywhere.", difficulty: 2 },
    ],
  },
  {
    name: "Memory & the JVM",
    summary: "Where objects live and how they are reclaimed.",
    entries: [
      { slug: "garbage-collection", title: "Reachability & garbage collection", tagline: "Freed because nothing can reach it, not because you stopped using it.", difficulty: 2 },
      { slug: "generational-gc", title: "Generational collection", tagline: "Most objects die young, so the heap is split to exploit that.", difficulty: 3 },
      { slug: "memory-leaks-in-java", title: "Leaks in a managed language", tagline: "A leak is a reference you forgot you were holding.", difficulty: 2 },
      { slug: "jvm-loading", title: "Class loading & static init", tagline: "When a class is loaded, and when its static block actually runs.", difficulty: 3 },
    ],
  },
  {
    name: "Collections",
    summary: "The data structures you reach for daily.",
    entries: [
      { slug: "arraylist-growth", title: "ArrayList vs LinkedList", tagline: "An array that occasionally moves, against a chain of scattered boxes.", difficulty: 2 },
      { slug: "hashmap-internals", title: "Inside HashMap", tagline: "Buckets, an index from the hash, and a chain when two keys collide.", difficulty: 2 },
      { slug: "treemap-and-ordering", title: "TreeMap & ordering", tagline: "A sorted map, Comparable vs Comparator, and O(log n).", difficulty: 2 },
      { slug: "iterators-and-fail-fast", title: "Iterators & ConcurrentModificationException", tagline: "Why removing during a for-each throws, and what to do instead.", difficulty: 2 },
    ],
  },
  {
    name: "Generics & errors",
    summary: "Type safety at compile time, failure at runtime.",
    entries: [
      { slug: "generics-basics", title: "Generics", tagline: "Type parameters, and the compile-time checks they buy you.", difficulty: 2 },
      { slug: "type-erasure", title: "Type erasure", tagline: "Generics vanish at runtime — which is why you cannot do new T[].", difficulty: 3 },
      { slug: "wildcards", title: "Wildcards & variance", tagline: "Producer extends, consumer super — and why a List<Dog> is not a List<Animal>.", difficulty: 3 },
      { slug: "exceptions-in-java", title: "Checked vs unchecked exceptions", tagline: "The stack trace as a record of the frames unwound.", difficulty: 2 },
      { slug: "try-with-resources", title: "try-with-resources", tagline: "Deterministic cleanup in a garbage-collected language.", difficulty: 2 },
    ],
  },
  {
    name: "Streams & concurrency",
    summary: "Declarative pipelines and more than one thread.",
    entries: [
      { slug: "streams-and-laziness", title: "Streams & laziness", tagline: "Intermediate operations build a pipeline; the terminal one runs it.", difficulty: 2 },
      { slug: "collectors", title: "Collectors & grouping", tagline: "Turning a stream back into a collection, map or summary.", difficulty: 2 },
      { slug: "optional", title: "Optional", tagline: "Making absence explicit in the type instead of returning null.", difficulty: 2 },
      { slug: "threads-basics", title: "Threads & the memory model", tagline: "Two threads, one field, and why you need happens-before.", difficulty: 3 },
      { slug: "synchronization", title: "synchronized, locks & atomics", tagline: "Mutual exclusion, and the cheaper options when contention is low.", difficulty: 3 },
      { slug: "executors", title: "Executors & thread pools", tagline: "Submitting tasks instead of creating threads.", difficulty: 3 },
    ],
  },
];

const csharp: CurriculumModule[] = [
  {
    name: "Foundations",
    summary: "The type system's central division.",
    entries: [
      { slug: "value-vs-reference-types", title: "struct vs class", tagline: "One keyword decides whether assignment copies data or a handle.", difficulty: 1 },
      { slug: "boxing-and-unboxing", title: "Boxing & unboxing", tagline: "Assigning an int to an object allocates, silently.", difficulty: 2 },
      { slug: "nullable-types", title: "Nullable value types & null safety", tagline: "int? is a struct; nullable reference types are a compiler promise.", difficulty: 2 },
      { slug: "properties-and-fields", title: "Properties, fields & auto-properties", tagline: "What the compiler generates behind { get; set; }.", difficulty: 1 },
    ],
  },
  {
    name: "Memory & resources",
    summary: "Allocation, collection, and deterministic cleanup.",
    entries: [
      { slug: "gc-generations", title: "Garbage collection & generations", tagline: "Gen 0, 1, 2 and the large object heap.", difficulty: 2 },
      { slug: "idisposable-and-using", title: "IDisposable & using", tagline: "Deterministic release for things the GC cannot schedule.", difficulty: 2 },
      { slug: "span-and-memory", title: "Span<T> & stack allocation", tagline: "Slicing without copying, and avoiding heap traffic entirely.", difficulty: 3 },
    ],
  },
  {
    name: "Collections & LINQ",
    summary: "Querying data in the language itself.",
    entries: [
      { slug: "list-and-arrays", title: "Arrays & List<T>", tagline: "Capacity, growth and the cost of inserting at the front.", difficulty: 1 },
      { slug: "dictionary-internals", title: "Inside Dictionary<K,V>", tagline: "Buckets, entries and why GetHashCode must agree with Equals.", difficulty: 2 },
      { slug: "linq-deferred-execution", title: "LINQ & deferred execution", tagline: "Building a query runs nothing; the last operator pulls elements through.", difficulty: 2 },
      { slug: "linq-operators", title: "The LINQ operators", tagline: "Where, Select, GroupBy, Join and the shapes they produce.", difficulty: 2 },
    ],
  },
  {
    name: "Delegates & async",
    summary: "Code as data, and work that takes time.",
    entries: [
      { slug: "delegates-and-events", title: "Delegates & events", tagline: "A typed reference to a method, and the publish/subscribe pattern.", difficulty: 2 },
      { slug: "lambdas-and-closures", title: "Lambdas & closures", tagline: "What gets captured, and why the loop-variable bug used to happen.", difficulty: 2 },
      { slug: "async-await", title: "async / await", tagline: "await does not wait — it returns and arranges a callback.", difficulty: 3 },
      { slug: "task-and-cancellation", title: "Tasks, cancellation & exceptions", tagline: "Cooperative cancellation, and where async exceptions surface.", difficulty: 3 },
    ],
  },
  {
    name: "Types & modern C#",
    summary: "Abstraction and the features that shaped current style.",
    entries: [
      { slug: "interfaces-and-generics", title: "Interfaces & generic constraints", tagline: "Constraining a type parameter to something you can actually call.", difficulty: 2 },
      { slug: "inheritance-virtual-override", title: "virtual, override & new", tagline: "Three keywords, and which one silently hides a method.", difficulty: 2 },
      { slug: "records-and-equality", title: "Records & value equality", tagline: "Generated equality, with-expressions and immutability by default.", difficulty: 2 },
      { slug: "pattern-matching", title: "Pattern matching", tagline: "switch expressions, type patterns and deconstruction.", difficulty: 2 },
      { slug: "extension-methods", title: "Extension methods", tagline: "Static methods that look like instance methods — and how LINQ is built.", difficulty: 2 },
    ],
  },
];

const linux: CurriculumModule[] = [
  {
    name: "Filesystem",
    summary: "One tree, and what a filename actually refers to.",
    entries: [
      { slug: "filesystem-and-paths", title: "The filesystem & paths", tagline: "One tree, one root; every path is from here or from the top.", difficulty: 1 },
      { slug: "file-permissions", title: "File permissions & chmod", tagline: "Nine bits, three groups of three. 644 is binary, not magic.", difficulty: 1 },
      { slug: "inodes-and-links", title: "Inodes, hard links & symlinks", tagline: "A filename is not the file — it is an entry pointing at one.", difficulty: 2 },
      { slug: "mounting-and-devices", title: "Mounting & devices", tagline: "Disks appear as directories; /dev is files that are hardware.", difficulty: 2 },
      { slug: "disk-usage", title: "Disk usage: df, du & quotas", tagline: "Why df and du disagree, and where the space actually went.", difficulty: 2 },
    ],
  },
  {
    name: "The shell",
    summary: "What the shell does to your command before running it.",
    entries: [
      { slug: "pipes-and-redirection", title: "Pipes & redirection", tagline: "Three streams per process; redirection just re-plugs them.", difficulty: 2 },
      { slug: "globbing-and-expansion", title: "Globbing & expansion", tagline: "The shell expands *, not the command — and the order matters.", difficulty: 2 },
      { slug: "quoting", title: "Quoting rules", tagline: "Single, double and none — the difference that breaks scripts on spaces.", difficulty: 2 },
      { slug: "variables-and-environment", title: "Variables & the environment", tagline: "Shell variables, exported variables, and what a child process inherits.", difficulty: 1 },
      { slug: "shell-scripting", title: "Scripts, exit codes & conditionals", tagline: "$?, set -e, and why [ is a command rather than syntax.", difficulty: 2 },
    ],
  },
  {
    name: "Text processing",
    summary: "The tools that make the pipeline worth having.",
    entries: [
      { slug: "grep-and-regex", title: "grep & regular expressions", tagline: "Matching lines, and the difference between basic and extended regex.", difficulty: 2 },
      { slug: "sed", title: "sed: stream editing", tagline: "Substitution, addresses and in-place edits.", difficulty: 2 },
      { slug: "awk", title: "awk: fields & records", tagline: "Every line split into fields, with a pattern-action program over them.", difficulty: 3 },
      { slug: "sort-uniq-cut", title: "sort, uniq, cut & tr", tagline: "The small tools that do most of the work in a real pipeline.", difficulty: 1 },
      { slug: "find", title: "find & xargs", tagline: "Walking the tree by predicate, and safely acting on the results.", difficulty: 2 },
    ],
  },
  {
    name: "Processes",
    summary: "What is running, and how to control it.",
    entries: [
      { slug: "processes-and-signals", title: "Processes, fork & signals", tagline: "Running a command means copying a process, then replacing it.", difficulty: 2 },
      { slug: "job-control", title: "Job control", tagline: "Ctrl-Z, bg, fg, nohup — and why closing the terminal kills things.", difficulty: 2 },
      { slug: "process-monitoring", title: "top, ps & process states", tagline: "Running, sleeping, uninterruptible — and what load average measures.", difficulty: 2 },
      { slug: "cron-and-systemd", title: "cron & systemd services", tagline: "Scheduling work, and why your cron job cannot find its commands.", difficulty: 2 },
    ],
  },
  {
    name: "Users & networking",
    summary: "Who you are, and how the machine talks.",
    entries: [
      { slug: "users-and-groups", title: "Users, groups & sudo", tagline: "UIDs, group membership, and what root actually means.", difficulty: 2 },
      { slug: "ssh-and-keys", title: "SSH & key authentication", tagline: "Public keys, known_hosts, and why permissions on ~/.ssh matter.", difficulty: 2 },
      { slug: "ports-and-sockets", title: "Ports, sockets & listening services", tagline: "What ss and netstat show, and what a port really is.", difficulty: 2 },
      { slug: "curl-and-http", title: "curl & inspecting HTTP", tagline: "Headers, status codes and following redirects from the terminal.", difficulty: 1 },
    ],
  },
  {
    name: "Packages & performance",
    summary: "Installing software and finding the bottleneck.",
    entries: [
      { slug: "package-managers", title: "Package managers", tagline: "apt, dnf and pacman — repositories, dependencies and lock files.", difficulty: 1 },
      { slug: "compiling-from-source", title: "Compiling from source", tagline: "configure, make, install — and where the files actually land.", difficulty: 2 },
      { slug: "memory-and-swap", title: "Memory, cache & swap", tagline: "Why free shows almost no free memory, and why that is correct.", difficulty: 2 },
      { slug: "logs-and-journald", title: "Logs & journald", tagline: "Where things get written, and how to follow them live.", difficulty: 1 },
    ],
  },
];

const data: CurriculumModule[] = [
  {
    name: "Foundations",
    summary: "The shape of tabular data, and how to select from it.",
    entries: [
      { slug: "dataframes-and-filtering", title: "DataFrames & filtering", tagline: "Filtering is a column of True and False laid over your rows.", difficulty: 1 },
      { slug: "loading-data", title: "Loading data", tagline: "CSV, Excel and SQL — delimiters, encodings and parse errors.", difficulty: 1 },
      { slug: "dtypes", title: "Dtypes & conversion", tagline: "Why a numeric column arrives as object, and what that costs.", difficulty: 1 },
      { slug: "indexing-and-selection", title: "Indexing: loc vs iloc", tagline: "Labels against positions, and the chained-assignment trap.", difficulty: 2 },
    ],
  },
  {
    name: "Cleaning",
    summary: "Real data is wrong before it is useful.",
    entries: [
      { slug: "missing-data", title: "Missing data & NaN", tagline: "A gap is a value; deciding what it means is your job.", difficulty: 2 },
      { slug: "duplicates", title: "Duplicates", tagline: "Finding them, deciding which to keep, and why joins create them.", difficulty: 1 },
      { slug: "outliers", title: "Outliers", tagline: "Detecting them, and the difference between wrong and merely extreme.", difficulty: 2 },
      { slug: "string-cleaning", title: "String cleaning", tagline: "Whitespace, case, and the categorical values that are almost equal.", difficulty: 1 },
    ],
  },
  {
    name: "Transforming",
    summary: "Reshaping data into the form the question needs.",
    entries: [
      { slug: "group-by", title: "Group-by: split, apply, combine", tagline: "Three steps behind one line of code.", difficulty: 2 },
      { slug: "joins-and-merges", title: "Joins & merges", tagline: "The interesting part is what happens to rows that do not match.", difficulty: 2 },
      { slug: "reshaping", title: "Reshaping: wide vs long", tagline: "pivot, melt and stack — the same data in two different shapes.", difficulty: 2 },
      { slug: "apply-vs-vectorise", title: "apply vs vectorised operations", tagline: "Why apply is a loop in disguise, and what to write instead.", difficulty: 2 },
    ],
  },
  {
    name: "Time series",
    summary: "Data where order and interval carry meaning.",
    entries: [
      { slug: "datetime-handling", title: "Dates & times", tagline: "Parsing, the DatetimeIndex, and time zones that ruin aggregates.", difficulty: 2 },
      { slug: "resampling", title: "Resampling", tagline: "Daily to monthly, and choosing the aggregation that fits the metric.", difficulty: 2 },
      { slug: "rolling-windows", title: "Rolling windows", tagline: "Moving averages, and the lookahead bias that invalidates a backtest.", difficulty: 3 },
    ],
  },
  {
    name: "Statistics",
    summary: "Describing a dataset without misleading yourself.",
    entries: [
      { slug: "descriptive-statistics", title: "Descriptive statistics", tagline: "Mean, median and spread — and when the mean is the wrong summary.", difficulty: 1 },
      { slug: "distributions", title: "Distributions & histograms", tagline: "Shape, skew, and why bin width changes the story.", difficulty: 2 },
      { slug: "correlation", title: "Correlation", tagline: "What r measures, what it misses, and Simpson's paradox.", difficulty: 2 },
      { slug: "sampling-and-uncertainty", title: "Sampling & uncertainty", tagline: "Why a difference in two averages may be nothing at all.", difficulty: 3 },
    ],
  },
  {
    name: "SQL",
    summary: "The same operations, expressed in the database.",
    entries: [
      { slug: "sql-select", title: "SELECT, WHERE & ORDER BY", tagline: "The logical order a query runs in, which is not the written order.", difficulty: 1 },
      { slug: "sql-joins", title: "Joins in SQL", tagline: "The same inner, left and outer decisions, with different syntax.", difficulty: 2 },
      { slug: "sql-aggregation", title: "GROUP BY & HAVING", tagline: "Aggregation, and why WHERE cannot filter on a count.", difficulty: 2 },
      { slug: "sql-window-functions", title: "Window functions", tagline: "Aggregate per row without collapsing rows — running totals and ranks.", difficulty: 3 },
      { slug: "sql-ctes", title: "CTEs & subqueries", tagline: "Naming intermediate results so a long query stays readable.", difficulty: 2 },
    ],
  },
];

const dsa: CurriculumModule[] = [
  {
    name: "Complexity",
    summary: "The vocabulary for saying why one solution beats another.",
    entries: [
      { slug: "big-o", title: "Big-O notation", tagline: "Counting how work grows with n, and ignoring everything else.", difficulty: 1 },
      { slug: "amortised-analysis", title: "Amortised analysis", tagline: "Why an occasionally expensive operation can still be O(1) on average.", difficulty: 2 },
      { slug: "space-complexity", title: "Space complexity", tagline: "Extra memory as a cost, including the stack recursion uses.", difficulty: 2 },
    ],
  },
  {
    name: "Arrays & strings",
    summary: "Contiguous memory, and the techniques it makes possible.",
    entries: [
      { slug: "array-memory", title: "Arrays in memory", tagline: "One block, constant-time indexing, and O(n) insertion in the middle.", difficulty: 1 },
      { slug: "dynamic-arrays", title: "Dynamic arrays & growth", tagline: "Doubling capacity, and why append is amortised O(1).", difficulty: 2 },
      { slug: "two-pointers", title: "Two pointers", tagline: "Two indices walking one array, turning O(n²) scans into O(n).", difficulty: 2 },
      { slug: "sliding-window", title: "Sliding window", tagline: "A range that grows and shrinks instead of being rebuilt.", difficulty: 2 },
      { slug: "prefix-sums", title: "Prefix sums", tagline: "Precompute once, answer any range query in constant time.", difficulty: 2 },
    ],
  },
  {
    name: "Linked structures",
    summary: "Nodes scattered in memory, held together by references.",
    entries: [
      { slug: "linked-list", title: "Singly linked lists", tagline: "O(1) insertion where arrays need O(n) — and O(n) access where arrays need O(1).", difficulty: 2 },
      { slug: "doubly-linked-list", title: "Doubly linked lists", tagline: "A back pointer, and the deletion it makes cheap.", difficulty: 2 },
      { slug: "list-reversal", title: "Reversing a list", tagline: "Three pointers, one pass, and the order of assignments that matters.", difficulty: 2 },
      { slug: "cycle-detection", title: "Cycle detection", tagline: "Floyd's slow and fast pointers, and why they must meet.", difficulty: 3 },
    ],
  },
  {
    name: "Stacks & queues",
    summary: "Restricting access on purpose.",
    entries: [
      { slug: "stack", title: "Stacks", tagline: "Last in, first out — and the call stack you already met.", difficulty: 1 },
      { slug: "queue", title: "Queues & circular buffers", tagline: "First in, first out, with a ring so nothing has to shift.", difficulty: 2 },
      { slug: "deque", title: "Deques", tagline: "Both ends open, and the operations that stay O(1).", difficulty: 2 },
      { slug: "monotonic-stack", title: "Monotonic stacks", tagline: "Keeping the stack sorted to answer next-greater in one pass.", difficulty: 3 },
    ],
  },
  {
    name: "Hashing",
    summary: "Turning a key into an address.",
    entries: [
      { slug: "hash-tables", title: "Hash tables", tagline: "A hash becomes a bucket index, and average O(1) lookup follows.", difficulty: 2 },
      { slug: "collision-resolution", title: "Collisions", tagline: "Chaining and open addressing — two answers to the same problem.", difficulty: 2 },
      { slug: "hash-sets", title: "Sets & deduplication", tagline: "Membership in constant time, and the frequency-count pattern.", difficulty: 1 },
    ],
  },
  {
    name: "Trees",
    summary: "Hierarchies with logarithmic depth, when you keep them balanced.",
    entries: [
      { slug: "binary-trees", title: "Binary trees", tagline: "Nodes, children, height — and why height decides the cost.", difficulty: 2 },
      { slug: "tree-traversals", title: "Traversals", tagline: "In-order, pre-order, post-order and level-order, and what each is for.", difficulty: 2 },
      { slug: "binary-search-trees", title: "Binary search trees", tagline: "The ordering invariant that turns search into a sequence of decisions.", difficulty: 2 },
      { slug: "bst-deletion", title: "BST deletion", tagline: "Three cases, and the successor that replaces a two-child node.", difficulty: 3 },
      { slug: "tree-balancing", title: "Balancing & rotations", tagline: "Why a sorted insert order degrades a BST into a linked list.", difficulty: 3 },
      { slug: "tries", title: "Tries", tagline: "One node per character — prefix search without scanning every word.", difficulty: 3 },
    ],
  },
  {
    name: "Heaps & priority queues",
    summary: "Fast access to the smallest thing, and nothing else.",
    entries: [
      { slug: "binary-heap", title: "Binary heaps", tagline: "A tree stored in an array, with the parent always winning.", difficulty: 2 },
      { slug: "heap-operations", title: "Push, pop & heapify", tagline: "Sift up, sift down, and building a heap in O(n).", difficulty: 3 },
      { slug: "priority-queues", title: "Priority queues in practice", tagline: "Scheduling, top-k, and merging sorted streams.", difficulty: 2 },
    ],
  },
  {
    name: "Sorting",
    summary: "The classic algorithms, and what separates them.",
    entries: [
      { slug: "simple-sorts", title: "Bubble, selection & insertion", tagline: "O(n²) sorts — and why insertion sort is still used inside fast ones.", difficulty: 1 },
      { slug: "merge-sort", title: "Merge sort", tagline: "Divide, sort halves, merge — stable and reliably O(n log n).", difficulty: 2 },
      { slug: "quicksort", title: "Quicksort", tagline: "Partition around a pivot, and the input that makes it O(n²).", difficulty: 3 },
      { slug: "heap-sort", title: "Heap sort", tagline: "Build a heap, then pop repeatedly — in place, no extra memory.", difficulty: 3 },
      { slug: "non-comparison-sorts", title: "Counting & radix sort", tagline: "Beating O(n log n) by not comparing elements at all.", difficulty: 3 },
      { slug: "sorting-stability", title: "Stability & choosing a sort", tagline: "What stability means, and when it changes your answer.", difficulty: 2 },
    ],
  },
  {
    name: "Searching",
    summary: "Finding things faster than looking at all of them.",
    entries: [
      { slug: "binary-search", title: "Binary search", tagline: "Halving the range each step — and the off-by-one that breaks it.", difficulty: 2 },
      { slug: "search-boundaries", title: "Lower & upper bound", tagline: "Finding the first or last match rather than any match.", difficulty: 3 },
      { slug: "binary-search-on-answer", title: "Binary search on the answer", tagline: "Searching a range of possible answers instead of an array.", difficulty: 3 },
    ],
  },
  {
    name: "Graphs",
    summary: "Nodes and edges — the most general structure here.",
    entries: [
      { slug: "graph-representation", title: "Representing a graph", tagline: "Adjacency list against adjacency matrix, and when each one wins.", difficulty: 2 },
      { slug: "bfs", title: "Breadth-first search", tagline: "A queue, level by level — and the shortest path in an unweighted graph.", difficulty: 2 },
      { slug: "dfs", title: "Depth-first search", tagline: "A stack, or recursion, and going as deep as possible first.", difficulty: 2 },
      { slug: "topological-sort", title: "Topological sort", tagline: "Ordering tasks so every dependency comes first.", difficulty: 3 },
      { slug: "dijkstra", title: "Dijkstra's algorithm", tagline: "Shortest paths with weights, using a priority queue.", difficulty: 3 },
      { slug: "union-find", title: "Union-find", tagline: "Connected components, with path compression making it near-constant.", difficulty: 3 },
    ],
  },
  {
    name: "Recursion & dynamic programming",
    summary: "Solving a problem by solving smaller versions of it.",
    entries: [
      { slug: "recursion-patterns", title: "Recursion & the recursion tree", tagline: "Drawing the calls to see the repeated work.", difficulty: 2 },
      { slug: "memoization", title: "Memoization", tagline: "Caching subproblems turns exponential into linear.", difficulty: 2 },
      { slug: "tabulation", title: "Tabulation", tagline: "Filling a table bottom-up, with no recursion at all.", difficulty: 3 },
      { slug: "classic-dp", title: "Classic DP problems", tagline: "Knapsack, LCS and edit distance — the same table, different rules.", difficulty: 3 },
      { slug: "backtracking", title: "Backtracking", tagline: "Trying a choice, undoing it, and pruning branches that cannot work.", difficulty: 3 },
    ],
  },
];

export const CURRICULUM: Record<TrackId, CurriculumModule[]> = {
  c,
  cpp,
  java,
  csharp,
  dsa,
  linux,
  data,
};

export function curriculumFor(track: TrackId): CurriculumModule[] {
  return CURRICULUM[track] ?? [];
}

export function curriculumCount(track: TrackId): number {
  return curriculumFor(track).reduce((n, module) => n + module.entries.length, 0);
}
