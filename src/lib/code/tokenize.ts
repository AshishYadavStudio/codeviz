/**
 * A deliberately small tokenizer, now covering every track's language.
 *
 * Full syntax highlighters ship a rainbow; this palette has six colours and a
 * reserved accent. Code is coloured like a lab notebook — structure in steel,
 * literals in green, everything else in ink — so the amber "current line"
 * marker never competes with syntax colour for attention.
 *
 * Line-scoped by design: keep sample code free of block comments that span
 * lines.
 */
import type { Language } from "@/lib/viz/types";

export type TokenKind =
  | "comment"
  | "preproc"
  | "string"
  | "number"
  | "keyword"
  | "type"
  | "fn"
  | "punct"
  | "plain";

export interface Token {
  text: string;
  kind: TokenKind;
}

interface LanguageSpec {
  keywords: Set<string>;
  types: Set<string>;
  /** Line-comment openers, longest first. */
  lineComments: string[];
  /** `#include`-style directives coloured as one unit. */
  directive?: RegExp;
  /** Bash-ish: the first word of a line is the command being run. */
  commandFirstWord?: boolean;
}

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const C_SHARED_TYPES =
  "char double float int long short signed unsigned void size_t bool auto";

const SPECS: Record<Language, LanguageSpec> = {
  c: {
    keywords: words(`auto break case const continue default do else enum extern for goto if
      inline register restrict return sizeof static struct switch typedef union volatile while
      NULL true false`),
    types: words(`${C_SHARED_TYPES} ptrdiff_t uint8_t uint16_t uint32_t int8_t int16_t int32_t FILE`),
    lineComments: ["//"],
    directive: /^\s*#/,
  },
  cpp: {
    keywords: words(`alignas alignof and break case catch class compl concept const consteval
      constexpr const_cast continue co_await co_return co_yield decltype default delete do
      dynamic_cast else enum explicit export extern false for friend goto if inline mutable
      namespace new noexcept not nullptr operator or private protected public reinterpret_cast
      return sizeof static static_assert static_cast struct switch template this throw true try
      typedef typeid typename union using virtual volatile while NULL override final`),
    types: words(`${C_SHARED_TYPES} string vector map set unordered_map unique_ptr shared_ptr
      weak_ptr ostream istream initializer_list nullptr_t uint32_t int64_t`),
    lineComments: ["//"],
    directive: /^\s*#/,
  },
  csharp: {
    keywords: words(`abstract as async await base break case catch checked class const continue
      default delegate do else enum event explicit extern false finally fixed for foreach get
      goto if implicit in interface internal is lock namespace new null operator out override
      params private protected public readonly record ref return sealed set sizeof stackalloc
      static struct switch this throw true try typeof unchecked unsafe using var virtual void
      volatile where while yield nameof`),
    types: words(`bool byte char decimal double float int long object sbyte short string uint
      ulong ushort void Span Memory List Dictionary IEnumerable IDisposable Task ValueTask
      Nullable Array String Int32 Object`),
    lineComments: ["//"],
    directive: /^\s*#(if|else|endif|region|endregion|define|pragma)/,
  },
  java: {
    keywords: words(`abstract assert break case catch class const continue default do else enum
      extends final finally for goto if implements import instanceof interface native new null
      package private protected public return static strictfp super switch synchronized this
      throw throws transient try var volatile while true false record sealed yield`),
    types: words(`boolean byte char double float int long short void String Integer Double
      Boolean Character Long Object List ArrayList Map HashMap Set HashSet StringBuilder
      Optional Stream Thread Exception RuntimeException`),
    lineComments: ["//"],
  },
  python: {
    keywords: words(`and as assert async await break class continue def del elif else except
      finally for from global if import in is lambda None nonlocal not or pass raise return try
      while with yield True False match case self`),
    types: words(`int float str bool list dict set tuple bytes object type range len print
      DataFrame Series ndarray`),
    lineComments: ["#"],
  },
  bash: {
    keywords: words(`if then else elif fi for while until do done case esac function in select
      break continue return exit local export readonly declare shift source alias unset time`),
    types: new Set<string>(),
    lineComments: ["#"],
    commandFirstWord: true,
  },
  sql: {
    keywords: words(`SELECT FROM WHERE GROUP BY ORDER HAVING JOIN INNER LEFT RIGHT FULL OUTER ON
      AS AND OR NOT NULL IS IN BETWEEN LIKE LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE
      CREATE TABLE DROP ALTER DISTINCT UNION ALL CASE WHEN THEN ELSE END WITH OVER PARTITION
      select from where group by order having join inner left right full outer on as and or not
      null is in between like limit offset distinct union all case when then else end with`),
    types: words(`INT INTEGER VARCHAR TEXT DATE TIMESTAMP BOOLEAN DECIMAL NUMERIC FLOAT
      COUNT SUM AVG MIN MAX ROUND COALESCE`),
    lineComments: ["--"],
  },
};

export function tokenize(line: string, language: Language = "c"): Token[] {
  const spec = SPECS[language] ?? SPECS.c;
  const out: Token[] = [];
  const push = (text: string, kind: TokenKind) => {
    if (text) out.push({ text, kind });
  };

  if (spec.directive?.test(line)) {
    push(line, "preproc");
    return out;
  }

  // In shell, the first bare word on a line is the program being invoked.
  let expectCommand = spec.commandFirstWord === true;

  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    let m: RegExpExecArray | null = null;

    const comment = spec.lineComments.find((c) => rest.startsWith(c));
    if (comment) {
      push(rest, "comment");
      break;
    }

    if ((m = /^\/\*.*?(\*\/|$)/.exec(rest))) {
      push(m[0], "comment");
    } else if ((m = /^"(?:\\.|[^"\\])*"?/.exec(rest))) {
      push(m[0], "string");
    } else if ((m = /^'(?:\\.|[^'\\])*'?/.exec(rest))) {
      push(m[0], "string");
    } else if ((m = /^(?:0[xXbB][0-9a-fA-F_]+|\d[\d_]*(?:\.\d+)?)[fFuUlLdD]*/.exec(rest))) {
      push(m[0], "number");
    } else if ((m = /^[A-Za-z_$][\w$]*/.exec(rest))) {
      const word = m[0];
      let kind: TokenKind;
      if (spec.types.has(word)) kind = "type";
      else if (spec.keywords.has(word)) kind = "keyword";
      else if (expectCommand) kind = "fn";
      else if (/^\s*\(/.test(rest.slice(word.length))) kind = "fn";
      else kind = "plain";
      push(word, kind);
      expectCommand = false;
    } else if ((m = /^\s+/.exec(rest))) {
      push(m[0], "plain");
    } else if (spec.commandFirstWord && (m = /^-{1,2}[A-Za-z0-9][\w-]*/.exec(rest))) {
      // shell flags read better as structure than as punctuation
      push(m[0], "keyword");
    } else if ((m = /^[+\-*/%=<>!&|^~?:;,.()[\]{}@#$\\]+/.exec(rest))) {
      push(m[0], "punct");
      // a pipe or semicolon starts a new command in shell
      if (spec.commandFirstWord && /[|;]/.test(m[0])) expectCommand = true;
    } else {
      push(rest[0], "plain");
      i += 1;
      continue;
    }

    i += m[0].length;
  }

  return out;
}

/** Kept for the existing C lessons. */
export const tokenizeC = (line: string) => tokenize(line, "c");

export const TOKEN_CLASS: Record<TokenKind, string> = {
  comment: "text-muted italic",
  preproc: "text-steel-ink",
  string: "text-green-ink",
  number: "text-ink font-medium",
  keyword: "text-steel-ink font-medium",
  type: "text-steel-ink",
  fn: "text-ink",
  punct: "text-muted",
  plain: "text-ink/90",
};

const EXTENSION: Record<Language, string> = {
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  java: "java",
  python: "py",
  bash: "sh",
  sql: "sql",
};

const DISPLAY: Record<Language, string> = {
  c: "C",
  cpp: "C++",
  csharp: "C#",
  java: "Java",
  python: "Python",
  bash: "Shell",
  sql: "SQL",
};

export const languageExtension = (language: Language) => EXTENSION[language] ?? "txt";
export const languageLabel = (language: Language) => DISPLAY[language] ?? language;
