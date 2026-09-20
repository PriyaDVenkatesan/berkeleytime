import classNames from "classnames";
import { InfoCircle } from "iconoir-react";

import { ColoredSquare, Tooltip } from "@repo/theme";

import { formatters } from "@/components/Chart";

import {
  type PnpOutcomeSummary,
  formatPnpOutcomeTooltip,
} from "./GradeBarGraph.utils";
import styles from "./PnpOutcomesSection.module.scss";

export interface PnpOutcomeItem {
  key: string;
  label: string;
  color: string;
  summary: PnpOutcomeSummary;
  dimmed: boolean;
}

interface PnpOutcomesSectionProps {
  items: PnpOutcomeItem[];
}

const PNP_HELP_DESCRIPTION =
  "Passing combines Pass (P) and Satisfactory (S) outcomes. Not passing combines No Pass (NP) and Unsatisfactory (U) outcomes.";

export default function PnpOutcomesSection({ items }: PnpOutcomesSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className={styles.section} aria-label="P/NP outcomes">
      <div className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>P/NP outcomes</h2>
          <Tooltip
            trigger={
              <button
                type="button"
                className={styles.helpButton}
                aria-label="About P/NP outcomes"
              >
                <InfoCircle width={16} height={16} />
              </button>
            }
            title="What P/NP includes"
            description={PNP_HELP_DESCRIPTION}
            side="top"
          />
        </div>
        <div className={styles.legend} aria-hidden="true">
          <span className={styles.legendItem}>
            <span className={classNames(styles.legendSwatch, styles.passing)} />
            Passing
          </span>
          <span className={styles.legendItem}>
            <span
              className={classNames(styles.legendSwatch, styles.notPassing)}
            />
            Not passing
          </span>
        </div>
      </div>
      <div className={styles.list}>
        {items.map((item) => (
          <PnpOutcomeRow key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}

function PnpOutcomeRow({ item }: { item: PnpOutcomeItem }) {
  const { summary, label, color, dimmed } = item;
  const passingPercent = (summary.passingCount / summary.pnpTotal) * 100;
  const notPassingPercent = 100 - passingPercent;
  const copy = formatPnpOutcomeTooltip({
    courseLabel: label,
    summary,
  });
  const recordNoun = summary.pnpTotal === 1 ? "P/NP record" : "P/NP records";

  return (
    <Tooltip
      trigger={
        <div
          className={classNames(styles.row, { [styles.dimmed]: dimmed })}
          tabIndex={0}
        >
          <div className={styles.rowHeader}>
            <span className={styles.courseLabel}>
              <ColoredSquare
                size="sm"
                color={color}
                variant="square"
                className={styles.swatch}
              />
              {label}
            </span>
            <span className={styles.passRate}>
              {formatters.percentRound(summary.passRatePercent)} passed
            </span>
          </div>
          <div
            className={styles.bar}
            role="img"
            aria-label={`${formatters.percentRound(summary.passRatePercent)} passed of ${summary.pnpTotal.toLocaleString()} ${recordNoun}`}
          >
            {passingPercent > 0 && (
              <div
                className={styles.passing}
                style={{ width: `${passingPercent}%` }}
              />
            )}
            {notPassingPercent > 0 && (
              <div
                className={styles.notPassing}
                style={{ width: `${notPassingPercent}%` }}
              />
            )}
          </div>
          <p className={styles.counts}>
            {summary.passingCount.toLocaleString()} passing ·{" "}
            {summary.notPassingCount.toLocaleString()} not passing ·{" "}
            {summary.pnpTotal.toLocaleString()} {recordNoun}
          </p>
          <p className={styles.share}>
            {summary.pnpTotal.toLocaleString()} {recordNoun} ·{" "}
            {formatters.percent(summary.pnpSharePercent, 1)} of all grade
            records
          </p>
        </div>
      }
      title={copy.title}
      description={
        <>
          {copy.lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </>
      }
      side="top"
    />
  );
}
