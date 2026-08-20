import type { CellState, Lesson, Region } from "@/lib/viz/types";

const CODE = `import pandas as pd

scores = pd.Series([55, 70, 72, 75, 78, 80, 82, 85, 90, 300])

scores.mean()     # 88.7  — pulled up by 300
scores.median()   # 79.0  — unaffected by 300
scores.std()      # 69.1  — high, because of 300

# describe() gives all of them at once
scores.describe()
#  count    10.0
#  mean     88.7
#  std      69.1
#  min      55.0
#  25%      71.5
#  50%      79.0  ← median
#  75%      83.75
#  max     300.0

# After removing the outlier
clean = scores[scores < 200]
clean.mean()      # 76.3
clean.median()    # 76.5  — almost equal → symmetric`;

function barChart(opts: {
  values: { id: string; label: string; height: number; state?: CellState }[];
  markers?: { id: string; label: string; position: number; state?: CellState }[];
  footer?: string;
  label: string;
}): Region {
  return {
    id: "chart",
    kind: "blocks",
    label: opts.label,
    caption: opts.footer,
    frames: opts.values.map((v) => ({
      id: v.id,
      label: v.label,
      cells: [{
        id: `${v.id}-bar`,
        value: String(v.height),
        state: v.state ?? "idle",
      }],
    })),
  };
}

function statsTable(opts: {
  stats: { id: string; name: string; value: string; state?: CellState; note?: string }[];
  label: string;
}): Region {
  return {
    id: "stats",
    kind: "table",
    label: opts.label,
    table: {
      columns: [
        { id: "stat", label: "statistic" },
        { id: "val", label: "value" },
      ],
      rows: opts.stats.map((s) => ({
        id: s.id,
        cells: [
          { id: `${s.id}-name`, value: s.name },
          { id: `${s.id}-val`, value: s.value, state: s.state ?? "idle" },
        ],
        note: s.note,
      })),
    },
  };
}

export const descriptiveStatistics: Lesson = {
  slug: "descriptive-statistics",
  track: "data",
  title: "Descriptive statistics",
  tagline: "Mean, median and spread — and when the mean is the wrong summary.",
  description:
    "See how one outlier pulls the mean far from the typical value while the median stays put, why standard deviation measures spread, and when describe() tells you the distribution is skewed.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "python",
  filename: "stats.py",
  keywords: ["mean", "median", "standard deviation", "describe", "outlier", "skew"],
  intro: [
    "Given a column of 1000 numbers, you can't look at each one. You need summaries — single numbers that stand in for the whole column. **Descriptive statistics** are those summaries.",
    "The three you use most: **mean** (add everything up, divide by count), **median** (sort and pick the middle), and **standard deviation** (how spread out from the mean the values are). They agree when data is nice. They disagree — and reveal problems — when it isn't.",
    "This lesson shows what happens when one outlier lands in the data. The mean gets pulled far from typical. The median doesn't budge. That gap is often the whole story.",
  ],
  stages: [
    {
      id: "data",
      title: "Ten scores, one outlier",
      body: [
        "Nine scores cluster between 55 and 90. One score is 300 — far outside the range. Whether it is a mistake or a legitimate value, it is going to distort any summary that uses it.",
        "The goal of descriptive statistics is to compress these ten numbers into one or two that capture what is typical.",
      ],
      code: CODE,
      activeLines: [3],
      scene: {
        regions: [
          barChart({
            label: "scores",
            values: [
              { id: "v55", label: "55", height: 55 },
              { id: "v70", label: "70", height: 70 },
              { id: "v72", label: "72", height: 72 },
              { id: "v75", label: "75", height: 75 },
              { id: "v78", label: "78", height: 78 },
              { id: "v80", label: "80", height: 80 },
              { id: "v82", label: "82", height: 82 },
              { id: "v85", label: "85", height: 85 },
              { id: "v90", label: "90", height: 90 },
              { id: "v300", label: "300", height: 300, state: "danger" },
            ],
            footer: "one value far from the rest",
          }),
        ],
        callout: { tone: "info", text: "Nine values cluster near 75. One is 300. How do you summarise this?" },
      },
    },
    {
      id: "mean",
      title: "Mean: sum ÷ count",
      body: [
        "The mean is 88.7 — higher than 9 out of 10 values. The 300 pulled the average up past almost every actual observation.",
        "The mean is sensitive to extreme values because it uses every number equally. One outlier can move it far from the centre of the data.",
      ],
      code: CODE,
      activeLines: [5],
      scene: {
        regions: [
          statsTable({
            label: "scores.mean()",
            stats: [
              { id: "sum", name: "sum", value: "887" },
              { id: "count", name: "count", value: "10" },
              { id: "mean", name: "mean", value: "88.7", state: "danger", note: "higher than 9 of 10 values" },
            ],
          }),
        ],
        callout: { tone: "danger", text: "Mean = 88.7, but 9 of 10 scores are below 90. The outlier dominates." },
      },
    },
    {
      id: "median",
      title: "Median: the middle value",
      body: [
        "Sort the values and take the middle one (or the average of the two middle ones). The median is 79.0 — much closer to the typical score.",
        "The 300 has no more influence than any other value: it is just \"the biggest\", and its magnitude is irrelevant. This is why the median is called *robust*.",
      ],
      code: CODE,
      activeLines: [6],
      scene: {
        regions: [
          statsTable({
            label: "scores.median()",
            stats: [
              { id: "sorted", name: "middle pair", value: "78, 80" },
              { id: "median", name: "median", value: "79.0", state: "success", note: "unaffected by the outlier" },
              { id: "mean2", name: "mean", value: "88.7", state: "danger" },
            ],
          }),
        ],
        callout: { tone: "success", text: "Median = 79.0. It represents the typical value. Mean = 88.7 does not." },
      },
    },
    {
      id: "std",
      title: "Standard deviation: how spread out",
      body: [
        "The standard deviation is 69.1 — unusually high for exam scores. It measures how far values typically sit from the mean.",
        "Without the 300, the std drops to about 10. A single outlier inflated the spread measure by 7×.",
      ],
      code: CODE,
      activeLines: [7],
      scene: {
        regions: [
          statsTable({
            label: "Spread",
            stats: [
              { id: "std", name: "std (with 300)", value: "69.1", state: "danger" },
              { id: "std2", name: "std (without)", value: "~10.3", state: "success" },
              { id: "range", name: "range", value: "300 - 55 = 245" },
            ],
          }),
        ],
        callout: { tone: "danger", text: "std = 69.1 because of one value. Remove it → std ≈ 10." },
      },
    },
    {
      id: "describe",
      title: "describe() gives the full picture",
      body: [
        "`.describe()` prints count, mean, std, min, quartiles and max in one call. The quartiles (25%, 50%, 75%) are percentiles — 50% is the median.",
        "When mean >> median, the distribution is right-skewed. That is the signal to look for outliers or use the median as your summary.",
      ],
      code: CODE,
      activeLines: [10, 11, 12, 13, 14, 15, 16, 17, 18],
      scene: {
        regions: [
          statsTable({
            label: "scores.describe()",
            stats: [
              { id: "d-count", name: "count", value: "10" },
              { id: "d-mean", name: "mean", value: "88.7", state: "danger" },
              { id: "d-std", name: "std", value: "69.1" },
              { id: "d-min", name: "min", value: "55" },
              { id: "d-25", name: "25%", value: "71.5" },
              { id: "d-50", name: "50%", value: "79.0", state: "success", note: "← median" },
              { id: "d-75", name: "75%", value: "83.75" },
              { id: "d-max", name: "max", value: "300", state: "danger" },
            ],
          }),
        ],
        callout: { tone: "active", text: "mean (88.7) >> median (79.0) → right-skewed. Look for outliers." },
      },
    },
    {
      id: "clean",
      title: "After removing the outlier",
      body: [
        "With the 300 removed, mean drops to 76.3 and median to 76.5 — nearly equal. When mean ≈ median, the data is roughly symmetric and the mean is a good summary.",
        "The rule of thumb: compare mean and median first. If they are close, the mean is fine. If they diverge, report the median and investigate why.",
      ],
      code: CODE,
      activeLines: [21, 22, 23],
      scene: {
        regions: [
          statsTable({
            label: "After removing 300",
            stats: [
              { id: "c-mean", name: "mean", value: "76.3", state: "success" },
              { id: "c-median", name: "median", value: "76.5", state: "success", note: "≈ mean → symmetric" },
              { id: "c-std", name: "std", value: "10.3", state: "success" },
            ],
          }),
        ],
        callout: {
          tone: "success",
          text: "Mean ≈ median → symmetric data. The mean is now a fair summary.",
        },
      },
    },
  ],
};
