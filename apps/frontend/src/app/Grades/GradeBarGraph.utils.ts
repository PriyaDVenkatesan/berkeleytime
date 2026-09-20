import { Letter } from "@repo/common";

import { LETTER_GRADES } from "@/lib/grades";

interface GradeCount {
  letter: string;
  count: number;
}

export type GradeChartRow = Record<string, number | string> & {
  letter: string;
};

export interface PnpOutcomeSummary {
  passingCount: number;
  notPassingCount: number;
  pnpTotal: number;
  allRecordsTotal: number;
  passRatePercent: number;
  pnpSharePercent: number;
}

const LETTER_GRADE_SET = new Set<string>(LETTER_GRADES);
const PASSING_PNP_LETTERS = new Set<string>([Letter.Pass, Letter.Satisfactory]);
const NOT_PASSING_PNP_LETTERS = new Set<string>([
  Letter.NotPass,
  Letter.Unsatisfactory,
]);

const countByLetters = (
  distribution: ReadonlyArray<GradeCount> | null | undefined,
  letters: ReadonlySet<string>
): number =>
  distribution?.reduce(
    (total, grade) => (letters.has(grade.letter) ? total + grade.count : total),
    0
  ) ?? 0;

const countAll = (
  distribution: ReadonlyArray<GradeCount> | null | undefined
): number =>
  distribution?.reduce((total, grade) => total + grade.count, 0) ?? 0;

const ordinal = (n: number): string => {
  const suffix = ["th", "st", "nd", "rd"];
  const remainder = n % 100;
  return `${n}${suffix[(remainder - 20) % 10] || suffix[remainder] || suffix[0]}`;
};

export const summarizePnpOutcomes = (
  distribution: ReadonlyArray<GradeCount> | null | undefined
): PnpOutcomeSummary | null => {
  const passingCount = countByLetters(distribution, PASSING_PNP_LETTERS);
  const notPassingCount = countByLetters(distribution, NOT_PASSING_PNP_LETTERS);
  const pnpTotal = passingCount + notPassingCount;
  if (pnpTotal === 0) return null;

  const allRecordsTotal = countAll(distribution);

  return {
    passingCount,
    notPassingCount,
    pnpTotal,
    allRecordsTotal,
    passRatePercent: (passingCount / pnpTotal) * 100,
    pnpSharePercent:
      allRecordsTotal === 0 ? 0 : (pnpTotal / allRecordsTotal) * 100,
  };
};

export const buildGradeChartData = (
  distributions: ReadonlyArray<ReadonlyArray<GradeCount> | null | undefined>,
  dataKeys: readonly string[]
): GradeChartRow[] => {
  const letterTotals = distributions.map((distribution) =>
    countByLetters(distribution, LETTER_GRADE_SET)
  );

  const rows = LETTER_GRADES.map<GradeChartRow>((letter) => ({ letter }));

  dataKeys.forEach((key, outputIndex) => {
    const distribution = distributions[outputIndex];
    const letterTotal = letterTotals[outputIndex] ?? 0;
    const percentages = new Map<string, number>();
    const counts = new Map<string, number>();

    LETTER_GRADES.forEach((letter) => {
      const count =
        distribution?.find((grade) => grade.letter === letter)?.count ?? 0;
      counts.set(letter, count);
      percentages.set(
        letter,
        letterTotal === 0 ? 0 : (count / letterTotal) * 100
      );
    });

    let cumulative = 0;
    const percentiles = new Map<string, readonly [number, number]>();
    for (let index = LETTER_GRADES.length - 1; index >= 0; index -= 1) {
      const letter = LETTER_GRADES[index];
      const percentage = percentages.get(letter) ?? 0;
      percentiles.set(letter, [cumulative, cumulative + percentage]);
      cumulative += percentage;
    }

    rows.forEach((row) => {
      const letter = row.letter;
      row[key] = percentages.get(letter) ?? 0;
      row[`${key}_count`] = counts.get(letter) ?? 0;
      row[`${key}_letterTotal`] = letterTotal;

      const percentile = percentiles.get(letter);
      if (percentile) {
        row[`${key}_pctlLo`] = percentile[0];
        row[`${key}_pctlHi`] = percentile[1];
      }
    });
  });

  return rows;
};

export const formatLetterGradeTooltip = ({
  letter,
  courseLabel,
  percentage,
  count,
  letterTotal,
  pctlLo,
  pctlHi,
}: {
  letter: string;
  courseLabel: string;
  percentage: number;
  count: number;
  letterTotal: number;
  pctlLo: number;
  pctlHi: number;
}): { title: string; lines: string[] } => {
  const recordNoun =
    letterTotal === 1 ? "letter-grade record" : "letter-grade records";

  return {
    title: `${letter} — ${courseLabel}`,
    lines: [
      `${percentage.toFixed(1)}% of letter grades`,
      `${count.toLocaleString()} of ${letterTotal.toLocaleString()} ${recordNoun}`,
      `Spans the ${ordinal(Math.round(pctlLo))}–${ordinal(
        Math.round(pctlHi)
      )} percentile`,
    ],
  };
};

export const formatPnpOutcomeTooltip = ({
  courseLabel,
  summary,
}: {
  courseLabel: string;
  summary: PnpOutcomeSummary;
}): { title: string; lines: string[] } => {
  const recordNoun = summary.pnpTotal === 1 ? "P/NP record" : "P/NP records";

  return {
    title: `${courseLabel} — P/NP outcomes`,
    lines: [
      `${summary.passRatePercent.toFixed(1)}% passed`,
      `${summary.passingCount.toLocaleString()} passing · ${summary.notPassingCount.toLocaleString()} not passing`,
      `${summary.pnpTotal.toLocaleString()} ${recordNoun}, ${summary.pnpSharePercent.toFixed(1)}% of all grade records`,
    ],
  };
};
