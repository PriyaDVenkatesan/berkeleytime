import { describe, expect, it } from "vitest";

import {
  buildGradeChartData,
  formatLetterGradeTooltip,
  formatPnpOutcomeTooltip,
  summarizePnpOutcomes,
} from "./GradeBarGraph.utils";

describe("buildGradeChartData", () => {
  it("excludes P/NP and S/U from letter-grade percentages and percentiles", () => {
    const rows = buildGradeChartData(
      [
        [
          { letter: "A", count: 30 },
          { letter: "F", count: 10 },
          { letter: "P", count: 40 },
          { letter: "NP", count: 20 },
          { letter: "S", count: 5 },
          { letter: "U", count: 5 },
        ],
      ],
      ["course0"]
    );

    const a = rows.find((row) => row.letter === "A");
    const f = rows.find((row) => row.letter === "F");
    const pass = rows.find((row) => row.letter === "P");

    expect(a).toMatchObject({
      course0: 75,
      course0_count: 30,
      course0_letterTotal: 40,
      course0_pctlLo: 25,
      course0_pctlHi: 100,
    });
    expect(f).toMatchObject({
      course0: 25,
      course0_count: 10,
      course0_letterTotal: 40,
      course0_pctlLo: 0,
      course0_pctlHi: 25,
    });
    expect(pass).toBeUndefined();
    expect(rows.every((row) => row.letter !== "NP")).toBe(true);
  });
});

describe("summarizePnpOutcomes", () => {
  it("combines P+S as passing and NP+U as not passing", () => {
    const summary = summarizePnpOutcomes([
      { letter: "A", count: 250 },
      { letter: "P", count: 40 },
      { letter: "S", count: 6 },
      { letter: "NP", count: 3 },
      { letter: "U", count: 1 },
    ]);

    expect(summary).toMatchObject({
      passingCount: 46,
      notPassingCount: 4,
      pnpTotal: 50,
      allRecordsTotal: 300,
    });
    expect(summary?.passRatePercent).toBeCloseTo(92);
    expect(summary?.pnpSharePercent).toBeCloseTo((50 / 300) * 100);
  });

  it("returns null when there are no P/NP or S/U records", () => {
    expect(
      summarizePnpOutcomes([
        { letter: "A", count: 10 },
        { letter: "B", count: 5 },
      ])
    ).toBeNull();
  });
});

describe("tooltip copy", () => {
  it("makes letter-grade denominators explicit", () => {
    expect(
      formatLetterGradeTooltip({
        letter: "A",
        courseLabel: "CS 61A",
        percentage: 18.4,
        count: 142,
        letterTotal: 773,
        pctlLo: 72,
        pctlHi: 90,
      })
    ).toEqual({
      title: "A — CS 61A",
      lines: [
        "18.4% of letter grades",
        "142 of 773 letter-grade records",
        "Spans the 72nd–90th percentile",
      ],
    });
  });

  it("makes P/NP pass rate and share explicit", () => {
    expect(
      formatPnpOutcomeTooltip({
        courseLabel: "CS 61A",
        summary: {
          passingCount: 46,
          notPassingCount: 4,
          pnpTotal: 50,
          allRecordsTotal: 300,
          passRatePercent: 92,
          pnpSharePercent: (50 / 300) * 100,
        },
      })
    ).toEqual({
      title: "CS 61A — P/NP outcomes",
      lines: [
        "92.0% passed",
        "46 passing · 4 not passing",
        "50 P/NP records, 16.7% of all grade records",
      ],
    });
  });
});
